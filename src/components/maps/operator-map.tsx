"use client";

import Link from "next/link";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { ArrowUpRight, Building2, MapPinned, RadioTower } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatLabel, formatPercent } from "@/lib/admin-dashboard";
import { cn } from "@/lib/utils";

const BOTSWANA_CENTER = {
  longitude: 24.6849,
  latitude: -22.3285,
};

type OperatorRiskLevel = "LOW" | "MEDIUM" | "HIGH";
type OperatorLicenseStatus =
  | "ACTIVE"
  | "UNDER_REVIEW"
  | "SUSPENDED"
  | "EXPIRED";

export type OperatorMapItem = {
  operatorId: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  city?: string | null;
  locationLabel?: string | null;
  licenseStatus?: OperatorLicenseStatus | null;
  riskLevel?: OperatorRiskLevel | null;
  complianceScore?: number | null;
  complaintCount?: number | null;
  activeEscalationCount?: number | null;
  underInvestigationCount?: number | null;
  regionCoverage?: string[];
  href?: string;
};

type OperatorMapProps = {
  operators: OperatorMapItem[];
  className?: string;
  title?: string;
  description?: string;
  mapStyle?: string;
  initialZoom?: number;
  initialCenter?: {
    longitude: number;
    latitude: number;
  };
  initialPitch?: number;
  initialBearing?: number;
  autoFitToOperators?: boolean;
  enable3dBuildings?: boolean;
  onSelectOperator?: (operator: OperatorMapItem) => void;
  defaultSelectedOperatorId?: string;
};

function addOpenFreeMapBuildingsLayer(map: MapLibreMap) {
  const sourceId = "openfreemap";
  const layerId = "3d-buildings";

  if (!map.getSource(sourceId)) {
    map.addSource(sourceId, {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet",
    });
  }

  if (map.getLayer(layerId)) {
    return;
  }

  const layers = map.getStyle().layers ?? [];
  const labelLayer = layers.find(
    (layer) =>
      layer.type === "symbol" &&
      typeof layer.layout === "object" &&
      layer.layout !== null &&
      "text-field" in layer.layout,
  );

  map.addLayer(
    {
      id: layerId,
      source: sourceId,
      "source-layer": "building",
      type: "fill-extrusion",
      minzoom: 15,
      filter: ["!=", ["get", "hide_3d"], true],
      paint: {
        "fill-extrusion-color": [
          "interpolate",
          ["linear"],
          ["get", "render_height"],
          0,
          "#d7dee7",
          120,
          "#94a3b8",
          260,
          "#64748b",
        ],
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          16,
          ["get", "render_height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          15,
          0,
          16,
          ["coalesce", ["get", "render_min_height"], 0],
        ],
        "fill-extrusion-opacity": 0.88,
      },
    },
    labelLayer?.id,
  );
}

function hasValidCoordinates(operator: OperatorMapItem) {
  return Number.isFinite(operator.latitude) && Number.isFinite(operator.longitude);
}

function getMarkerTone(operator: OperatorMapItem) {
  if (
    operator.licenseStatus === "SUSPENDED" ||
    operator.riskLevel === "HIGH"
  ) {
    return "operator-map-marker--critical";
  }

  if (
    operator.licenseStatus === "UNDER_REVIEW" ||
    operator.licenseStatus === "EXPIRED" ||
    operator.riskLevel === "MEDIUM"
  ) {
    return "operator-map-marker--watch";
  }

  return "operator-map-marker--stable";
}

function buildCoordinatesSignature(operators: OperatorMapItem[]) {
  return operators
    .map(
      (operator) =>
        `${operator.operatorId}:${operator.longitude}:${operator.latitude}`,
    )
    .join("|");
}

function createPopupContent(operator: OperatorMapItem) {
  const container = document.createElement("div");
  container.className = "operator-map-popup-card";

  const title = document.createElement("p");
  title.className = "operator-map-popup-title";
  title.textContent = operator.name;
  container.appendChild(title);

  const location = document.createElement("p");
  location.className = "operator-map-popup-subtitle";
  location.textContent =
    operator.locationLabel ??
    operator.address ??
    operator.city ??
    "Operator location";
  container.appendChild(location);

  const metrics = document.createElement("div");
  metrics.className = "operator-map-popup-metrics";

  const complaintMetric = document.createElement("span");
  complaintMetric.textContent = `${operator.complaintCount ?? 0} complaints`;
  metrics.appendChild(complaintMetric);

  const escalationMetric = document.createElement("span");
  escalationMetric.textContent = `${operator.activeEscalationCount ?? 0} active`;
  metrics.appendChild(escalationMetric);

  container.appendChild(metrics);
  return container;
}

function createMarkerElement(
  operator: OperatorMapItem,
  isSelected: boolean,
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = cn(
    "operator-map-marker",
    getMarkerTone(operator),
    isSelected && "operator-map-marker--selected",
  );
  element.setAttribute(
    "aria-label",
    operator.href
      ? `Open ${operator.name} performance page`
      : `View ${operator.name} on map`,
  );

  const dot = document.createElement("span");
  dot.className = "operator-map-marker-dot";
  dot.setAttribute("aria-hidden", "true");
  element.appendChild(dot);

  const tag = document.createElement("span");
  tag.className = "operator-map-marker-tag";

  const eyebrow = document.createElement("span");
  eyebrow.className = "operator-map-marker-eyebrow";
  eyebrow.textContent = "Operator";
  tag.appendChild(eyebrow);

  const text = document.createElement("span");
  text.className = "operator-map-marker-text";
  text.textContent = operator.name;
  tag.appendChild(text);

  element.appendChild(tag);

  return element;
}

export function OperatorMap({
  operators,
  className,
  title = "Operator map",
  description = "MapLibre GL surface for plotting operators and opening a focused performance panel on click.",
  mapStyle = "https://tiles.openfreemap.org/styles/bright",
  initialZoom = 5.6,
  initialCenter = BOTSWANA_CENTER,
  initialPitch = 0,
  initialBearing = 0,
  autoFitToOperators = true,
  enable3dBuildings = false,
  onSelectOperator,
  defaultSelectedOperatorId,
}: OperatorMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Map<string, MapLibreMarker>>(new Map());
  const maplibreModuleRef = useRef<(typeof import("maplibre-gl")) | null>(null);
  const fittedSignatureRef = useRef<string | null>(null);

  const validOperators = operators.filter(hasValidCoordinates);
  const coordinatesSignature = buildCoordinatesSignature(validOperators);

  const [selectedOperatorId, setSelectedOperatorId] = useState<string | null>(
    defaultSelectedOperatorId ?? validOperators[0]?.operatorId ?? null,
  );
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const selectOperatorFromEffect = useEffectEvent((operator: OperatorMapItem) => {
    setSelectedOperatorId(operator.operatorId);
    onSelectOperator?.(operator);
  });

  function handleOperatorSelect(operator: OperatorMapItem) {
    setSelectedOperatorId(operator.operatorId);
    onSelectOperator?.(operator);
  }

  useEffect(() => {
    if (validOperators.length === 0) {
      setSelectedOperatorId(null);
      return;
    }

    const nextSelectedExists = validOperators.some(
      (operator) => operator.operatorId === selectedOperatorId,
    );

    if (!nextSelectedExists) {
      setSelectedOperatorId(defaultSelectedOperatorId ?? validOperators[0].operatorId);
    }
  }, [defaultSelectedOperatorId, selectedOperatorId, validOperators]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    let cancelled = false;
    const ownedMarkers = markersRef.current;

    void import("maplibre-gl")
      .then((maplibregl) => {
        if (cancelled || !containerRef.current) {
          return;
        }

        maplibreModuleRef.current = maplibregl;

        const map = new maplibregl.default.Map({
          container: containerRef.current,
          style: mapStyle,
          center: [initialCenter.longitude, initialCenter.latitude],
          zoom: initialZoom,
          pitch: initialPitch,
          bearing: initialBearing,
          attributionControl: true,
          canvasContextAttributes: enable3dBuildings
            ? { antialias: true }
            : undefined,
        });

        mapRef.current = map;

        map.addControl(new maplibregl.default.NavigationControl(), "top-right");
        map.addControl(new maplibregl.default.ScaleControl(), "bottom-left");
        map.on("load", () => {
          if (enable3dBuildings) {
            addOpenFreeMapBuildingsLayer(map);
          }
          setMapReady(true);
        });
        map.on("error", (event) => {
          if ("error" in event && event.error) {
            setMapError(event.error.message);
          }
        });
      })
      .catch((error: unknown) => {
        setMapError(
          error instanceof Error ? error.message : "Failed to load MapLibre GL.",
        );
      });

    return () => {
      cancelled = true;
      setMapReady(false);
      fittedSignatureRef.current = null;
      ownedMarkers.forEach((marker) => marker.remove());
      ownedMarkers.clear();
      mapRef.current?.remove();
      mapRef.current = null;
      maplibreModuleRef.current = null;
    };
  }, [
    enable3dBuildings,
    initialBearing,
    initialCenter.latitude,
    initialCenter.longitude,
    initialPitch,
    initialZoom,
    mapStyle,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current?.default;

    if (!mapReady || !map || !maplibregl) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    for (const operator of validOperators) {
      const markerElement = createMarkerElement(
        operator,
        operator.operatorId === selectedOperatorId,
      );
      markerElement.addEventListener("click", () => {
        if (operator.href) {
          window.location.href = operator.href;
          return;
        }

        selectOperatorFromEffect(operator);
      });

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: "operator-map-popup",
        offset: 18,
      }).setDOMContent(createPopupContent(operator));

      const marker = new maplibregl.Marker({
        anchor: "center",
        element: markerElement,
      })
        .setLngLat([operator.longitude, operator.latitude])
        .setPopup(popup)
        .addTo(map);

      markersRef.current.set(operator.operatorId, marker);
    }
  }, [
    coordinatesSignature,
    mapReady,
    selectedOperatorId,
    validOperators,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreModuleRef.current?.default;

    if (!mapReady || !map || !maplibregl) {
      return;
    }

    if (!autoFitToOperators) {
      return;
    }

    if (coordinatesSignature.length === 0) {
      map.easeTo({
        center: [initialCenter.longitude, initialCenter.latitude],
        duration: 600,
        zoom: initialZoom,
      });
      return;
    }

    if (fittedSignatureRef.current === coordinatesSignature) {
      return;
    }

    fittedSignatureRef.current = coordinatesSignature;

    if (validOperators.length === 1) {
      const [operator] = validOperators;
      map.easeTo({
        center: [operator.longitude, operator.latitude],
        duration: 700,
        zoom: 10.5,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    for (const operator of validOperators) {
      bounds.extend([operator.longitude, operator.latitude]);
    }

    map.fitBounds(bounds, {
      duration: 0,
      maxZoom: 10.5,
      padding: 80,
    });
  }, [
    autoFitToOperators,
    coordinatesSignature,
    initialCenter.latitude,
    initialCenter.longitude,
    initialZoom,
    mapReady,
    validOperators,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    const selectedOperator = validOperators.find(
      (operator) => operator.operatorId === selectedOperatorId,
    );

    if (!mapReady || !map || !selectedOperator) {
      return;
    }

    map.flyTo({
      center: [selectedOperator.longitude, selectedOperator.latitude],
      duration: 900,
      essential: true,
      zoom: Math.max(map.getZoom(), 9.2),
    });
  }, [mapReady, selectedOperatorId, validOperators]);

  const selectedOperator =
    validOperators.find((operator) => operator.operatorId === selectedOperatorId) ??
    null;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="border-b border-slate-200/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-kicker">MapLibre GL</p>
            <CardTitle className="mt-2 text-2xl">{title}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl">
              {description}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{validOperators.length} mapped operators</Badge>
            <Badge variant="success">No token needed</Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <div className="space-y-4">
              <div className="operator-map-frame">
                <div className="operator-map-canvas" ref={containerRef} />
                {mapError ? (
                  <div className="operator-map-overlay">
                    <p className="operator-map-overlay-title">Map failed to load</p>
                    <p className="operator-map-overlay-copy">{mapError}</p>
                  </div>
                ) : null}
                {mapReady && validOperators.length === 0 ? (
                  <div className="operator-map-overlay">
                    <p className="operator-map-overlay-title">No coordinates yet</p>
                    <p className="operator-map-overlay-copy">
                      Add operator latitude and longitude values, then this map
                      will render clickable performance points.
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p className="text-kicker">Mapped</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {validOperators.length}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Operators with usable coordinates.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p className="text-kicker">High pressure</p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {
                      validOperators.filter(
                        (operator) =>
                          operator.riskLevel === "HIGH" ||
                          (operator.activeEscalationCount ?? 0) > 0,
                      ).length
                    }
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Operators worth immediate visual attention.
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-slate-50 px-4 py-4">
                  <p className="text-kicker">Selected</p>
                  <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.04em] text-slate-950">
                    {selectedOperator?.name ?? "None"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Marker click syncs this detail panel.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-slate-200/70 bg-slate-50/80 p-5">
                <p className="text-kicker">Selected operator</p>
                {selectedOperator ? (
                  <div className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xl font-semibold tracking-[-0.03em] text-slate-950">
                          {selectedOperator.name}
                        </p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {selectedOperator.locationLabel ??
                            selectedOperator.address ??
                            selectedOperator.city ??
                            "Address not provided yet"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedOperator.licenseStatus ? (
                          <Badge variant="outline">
                            {formatLabel(selectedOperator.licenseStatus)}
                          </Badge>
                        ) : null}
                        {selectedOperator.riskLevel ? (
                          <Badge
                            variant={
                              selectedOperator.riskLevel === "HIGH"
                                ? "danger"
                                : selectedOperator.riskLevel === "MEDIUM"
                                  ? "warning"
                                  : "success"
                            }
                          >
                            {formatLabel(selectedOperator.riskLevel)} risk
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-[1rem] bg-white px-3 py-3">
                        <p className="text-kicker">Complaints</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {selectedOperator.complaintCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[1rem] bg-white px-3 py-3">
                        <p className="text-kicker">Active escalations</p>
                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {selectedOperator.activeEscalationCount ?? 0}
                        </p>
                      </div>
                      <div className="rounded-[1rem] bg-slate-950 px-3 py-3 text-white">
                        <p className="text-kicker text-slate-300">Compliance</p>
                        <p className="mt-2 text-xl font-semibold">
                          {formatPercent(selectedOperator.complianceScore)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>Compliance score</span>
                        <span className="font-semibold text-slate-950">
                          {formatPercent(selectedOperator.complianceScore)}
                        </span>
                      </div>
                      <Progress value={selectedOperator.complianceScore ?? 0} />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1rem] border border-slate-200/70 bg-white px-4 py-4">
                        <div className="flex items-center gap-3">
                          <MapPinned className="text-teal-700" size={17} />
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              Location
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {selectedOperator.city ?? "Botswana"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-[1rem] border border-slate-200/70 bg-white px-4 py-4">
                        <div className="flex items-center gap-3">
                          <RadioTower className="text-teal-700" size={17} />
                          <div>
                            <p className="text-sm font-semibold text-slate-950">
                              Under investigation
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {selectedOperator.underInvestigationCount ?? 0} cases
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedOperator.regionCoverage &&
                    selectedOperator.regionCoverage.length > 0 ? (
                      <div>
                        <p className="mb-2 text-kicker">Coverage</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedOperator.regionCoverage.map((region) => (
                            <Badge key={region} variant="secondary">
                              {region}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {selectedOperator.href ? (
                      <Link
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#17345c_65%,#0f766e_100%)] px-5 text-sm font-semibold text-white shadow-[0_18px_44px_rgba(15,23,42,0.22)] transition hover:brightness-105"
                        href={selectedOperator.href}
                      >
                        Open linked view
                        <ArrowUpRight size={16} />
                      </Link>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-4 rounded-[1rem] bg-white px-4 py-4 text-sm text-slate-500">
                    Select a marker or operator row to inspect the performance
                    summary.
                  </div>
                )}
              </div>

              <div className="rounded-[1.5rem] border border-slate-200/70 bg-white p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-kicker">Operator list</p>
                  <Badge variant="secondary">Map synced</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  {validOperators.map((operator) => {
                    const isActive = operator.operatorId === selectedOperatorId;

                    return (
                      <button
                        className={cn(
                          "flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left transition",
                          isActive
                            ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100",
                        )}
                        key={operator.operatorId}
                        onClick={() => handleOperatorSelect(operator)}
                        type="button"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {operator.name}
                          </p>
                          <p
                            className={cn(
                              "mt-1 truncate text-sm",
                              isActive ? "text-slate-300" : "text-slate-500",
                            )}
                          >
                            {operator.city ?? operator.locationLabel ?? "Botswana"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building2 size={16} />
                          <span className="text-sm font-semibold">
                            {operator.activeEscalationCount ?? 0}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
      </CardContent>
    </Card>
  );
}
