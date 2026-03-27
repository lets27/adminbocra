"use client";

import { useQuery } from "convex/react";
import { Activity, Building2, MapPinned, ShieldAlert } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { OperatorMap } from "@/components/maps/operator-map";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function MapContent() {
  const operators = useQuery(api.admin.operators.getOperators, {
    limit: 50,
  });
  const operatorAnalytics = useQuery(api.admin.analytics.getAnalyticsByOperator, {});

  if (operators === undefined || operatorAnalytics === undefined) {
    return <div className="panel-shell h-[42rem] animate-pulse" />;
  }

  const analyticsByOperatorId = new Map(
    operatorAnalytics.results.map((operator) => [operator.operatorId, operator]),
  );

  const mapOperators = operators.map((operator) => {
    const analytics = analyticsByOperatorId.get(operator._id);

    return {
      operatorId: operator._id,
      name: operator.name,
      latitude: operator.latitude ?? Number.NaN,
      longitude: operator.longitude ?? Number.NaN,
      address: operator.physicalAddress ?? null,
      city: operator.city ?? null,
      locationLabel: operator.locationLabel ?? null,
      licenseStatus: operator.licenseStatus,
      riskLevel: operator.riskLevel,
      complianceScore: operator.complianceScore ?? null,
      complaintCount: analytics?.complaintCount ?? operator.complaintCount,
      activeEscalationCount: operator.activeEscalationCount,
      underInvestigationCount: analytics?.underInvestigationCount ?? 0,
      regionCoverage: operator.regionCoverage,
      href: `/operators/${operator._id}`,
    };
  });

  const mappedOperators = mapOperators.filter(
    (operator) =>
      Number.isFinite(operator.latitude) && Number.isFinite(operator.longitude),
  );
  const missingCoordinates = mapOperators.filter(
    (operator) =>
      !Number.isFinite(operator.latitude) || !Number.isFinite(operator.longitude),
  );
  const totalActiveEscalations = mapOperators.reduce(
    (sum, operator) => sum + (operator.activeEscalationCount ?? 0),
    0,
  );
  const totalUnderInvestigation = mapOperators.reduce(
    (sum, operator) => sum + (operator.underInvestigationCount ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-4">
        {[
          {
            label: "Operators",
            value: mapOperators.length,
            detail: "Live operator records returned from Convex.",
            icon: Building2,
          },
          {
            label: "Mapped",
            value: mappedOperators.length,
            detail: "Operators carrying stored latitude and longitude.",
            icon: MapPinned,
          },
          {
            label: "Active escalations",
            value: totalActiveEscalations,
            detail: "Total current queue pressure across mapped operators.",
            icon: ShieldAlert,
          },
          {
            label: "Under investigation",
            value: totalUnderInvestigation,
            detail: "Cases already in formal BOCRA handling.",
            icon: Activity,
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-kicker">{item.label}</p>
                  <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white">
                    <Icon size={18} />
                  </div>
                </div>
                <CardTitle className="text-4xl">{item.value}</CardTitle>
                <CardDescription>{item.detail}</CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {missingCoordinates.length > 0 ? (
        <Card>
          <CardHeader>
            <p className="text-kicker">Location sync</p>
            <CardTitle className="mt-2 text-2xl">
              Some operators are still missing coordinates
            </CardTitle>
            <CardDescription className="mt-2">
              Existing records created before the location fields were added may
              need the operator seed to be run again so the map can place them.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {missingCoordinates.map((operator) => (
              <Badge key={operator.operatorId} variant="outline">
                {operator.name}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <OperatorMap
        description="Live operator locations backed by Convex, now on a street-level city basemap with roads, labels, and building context for BOCRA field review."
        enable3dBuildings
        initialBearing={-18}
        initialCenter={{ latitude: -24.6282, longitude: 25.9231 }}
        initialPitch={48}
        initialZoom={15.2}
        mapStyle="https://tiles.openfreemap.org/styles/bright"
        autoFitToOperators={false}
        operators={mapOperators}
        title="Gaborone Operator Intelligence Map"
      />
    </div>
  );
}

export function MapView() {
  return (
    <AdminShell
      actions={<Badge variant="success">Map live</Badge>}
      description="Geospatial operator view for BOCRA staff, combining stored operator locations with live performance and complaint analytics."
      kicker="Admin layer / map"
      title="Operator Map"
    >
      {() => <MapContent />}
    </AdminShell>
  );
}
