/**
 * Loopback trust fence for the notes API routes: socket address, Host header,
 * and browser same-origin markers. Notes may hold credentials and other
 * sensitive values, so the API must stay reachable only from the local
 * browser UI. X-Forwarded-For is never trusted.
 * @module dsh-web-notes/loopback
 */
import type { IncomingMessage } from 'node:http';
/** IPv4 127/8 predicate (four decimal octets, first == 127). */
export declare function isIPv4Loopback(v4: string): boolean;
/** Whether a socket remote address names the loopback range (127/8, ::1, IPv4-mapped). */
export declare function isLoopbackAddress(address: string | undefined): boolean;
/** Whether a normalized URL hostname names the loopback authority (localhost, [::1], 127/8). */
export declare function isLoopbackHostname(hostname: string): boolean;
/**
 * Request-level trust fence: a loopback socket address AND a loopback Host
 * header, plus browser same-origin markers.
 */
export declare function isLoopbackRequest(request: IncomingMessage): boolean;
//# sourceMappingURL=loopback.d.ts.map