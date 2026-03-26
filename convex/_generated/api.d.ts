/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_analytics from "../admin/analytics.js";
import type * as admin_complaints from "../admin/complaints.js";
import type * as admin_licensing from "../admin/licensing.js";
import type * as admin_operators from "../admin/operators.js";
import type * as admin_seed from "../admin/seed.js";
import type * as admin_seedAction from "../admin/seedAction.js";
import type * as admin_seedFixtures from "../admin/seedFixtures.js";
import type * as operator_complaints from "../operator/complaints.js";
import type * as operator_metrics from "../operator/metrics.js";
import type * as public_complaints from "../public/complaints.js";
import type * as public_metrics from "../public/metrics.js";
import type * as public_tracking from "../public/tracking.js";
import type * as shared_auth from "../shared/auth.js";
import type * as shared_complaintDocuments from "../shared/complaintDocuments.js";
import type * as shared_complaints from "../shared/complaints.js";
import type * as shared_escalation from "../shared/escalation.js";
import type * as shared_roles from "../shared/roles.js";
import type * as shared_uploads from "../shared/uploads.js";
import type * as shared_utils from "../shared/utils.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/analytics": typeof admin_analytics;
  "admin/complaints": typeof admin_complaints;
  "admin/licensing": typeof admin_licensing;
  "admin/operators": typeof admin_operators;
  "admin/seed": typeof admin_seed;
  "admin/seedAction": typeof admin_seedAction;
  "admin/seedFixtures": typeof admin_seedFixtures;
  "operator/complaints": typeof operator_complaints;
  "operator/metrics": typeof operator_metrics;
  "public/complaints": typeof public_complaints;
  "public/metrics": typeof public_metrics;
  "public/tracking": typeof public_tracking;
  "shared/auth": typeof shared_auth;
  "shared/complaintDocuments": typeof shared_complaintDocuments;
  "shared/complaints": typeof shared_complaints;
  "shared/escalation": typeof shared_escalation;
  "shared/roles": typeof shared_roles;
  "shared/uploads": typeof shared_uploads;
  "shared/utils": typeof shared_utils;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
