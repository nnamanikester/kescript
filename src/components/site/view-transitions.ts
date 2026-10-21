/**
 * Runs before anything else on the page (inline in <head>).
 *
 * When a React <ViewTransition> update lands while the tab is hidden, Chrome
 * skips the animation and rejects with InvalidStateError. The update itself
 * still applies. React means to ignore exactly this, but it matches Chrome's
 * older wording ("…invalid state"), so the newer "…invalid state. Document
 * hidden" is reported as an uncaught error. This drops only that error,
 * before Next's dev overlay sees it (capture listeners on window run first).
 */
export const viewTransitionGuardScript = `(() => {
  var skipped = function (e) {
    return !!e && e.name === "InvalidStateError" &&
      /^Transition was aborted because of invalid state|visibility state (is|has become) hidden/.test(e.message || "");
  };
  var drop = function (ev, err) { if (skipped(err)) { ev.preventDefault(); ev.stopImmediatePropagation(); } };
  addEventListener("error", function (ev) { drop(ev, ev.error); }, true);
  addEventListener("unhandledrejection", function (ev) { drop(ev, ev.reason); }, true);
})();`;
