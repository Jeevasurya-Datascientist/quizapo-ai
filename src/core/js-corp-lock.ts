
// JS Corp Core Locking Mechanism
// DO NOT MODIFY: Critical System Component

// 1. Obfuscated Constants
const _c = ['J', 'S', ' ', 'C', 'o', 'r', 'p'];
export const JS_CORP_ID = _c.join(''); // "JS Corp"

const _s = [83, 101, 99, 117, 114, 101, 67, 111, 114, 101]; // "SecureCore"
const _k = String.fromCharCode(..._s);

// 2. Internal Integrity Hash (Pre-computed for "JS Corp Engine")
const INTEGRITY_HASH = "a4043"; // Correct hash for "JS Corp Engine"

const computeHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 5);
};

// 3. Runtime Verification
export const verifyJsCorp = (): boolean => {
    // A. Check Obfuscated String
    if (JS_CORP_ID !== "JS Corp") {
        throw new Error("Core Integrity Check Failed: Identity Mismatch");
    }

    // B. Check Environment / Global Fallback
    // Ensure key exists in memory
    if (!(window as any).__JS_CORP_ACTIVE__) {
        (window as any).__JS_CORP_ACTIVE__ = Date.now();
    }

    // C. Hash Verification
    const currentHash = computeHash(JS_CORP_ID + " Engine");
    if (currentHash !== INTEGRITY_HASH) {
        console.error("Tamper detection triggered.");
        return false;
    }

    return true;
};

// 4. Initialization & Console Banner
export const initJsCorp = () => {
    // Set global flag
    (window as any).__JS_CORP_ACTIVE__ = Date.now();

    // Console Watermark
    console.info(
        `%c ${JS_CORP_ID} Framework Initialized `,
        'background: #000; color: #fff; padding: 4px; border-radius: 4px; font-weight: bold; border: 1px solid #333;'
    );

    // Verify immediately
    if (!verifyJsCorp()) {
        console.error("Core Integrity Check Failed during Init.");
        // document.body.innerHTML = "<h1 style='color:red;padding:20px;font-family:sans-serif'>Critical Error: Core Integrity Failed.</h1>";
        // throw new Error("System Halted.");
    }
};

// 5. Dependency Injection helper
// wraps a value, but fails if check fails. Used to force imports.
export const secureCore = <T>(value: T): T => {
    if (!verifyJsCorp()) {
        throw new Error("Access Denied: Unverified Core");
    }
    return value;
};
