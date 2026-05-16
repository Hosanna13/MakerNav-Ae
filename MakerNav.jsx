// ================================================================
//  MarkerNav.jsx  —  After Effects Marker Navigation Panel
//  Infinitely loops through all comp markers with Prev / Next.
//
//  INSTALL (dockable):
//    Mac: ~/Library/Application Support/Adobe/After Effects <version>/Scripts/ScriptUI Panels/
//    Win: C:\Users\<name>\AppData\Roaming\Adobe\After Effects <version>\Scripts\ScriptUI Panels\
//    → Restart AE → Window menu
//
//  ONE-TIME RUN:
//    File → Scripts → Run Script File…
// ================================================================

(function buildMarkerNav(thisObj) {

    var currentIndex = 0; // tracks position in marker list

    var win = (thisObj instanceof Panel)
        ? thisObj
        : new Window("palette", "Marker Nav", undefined, { resizeable: false });

    win.orientation   = "column";
    win.alignChildren = ["fill", "top"];
    win.margins       = 14;
    win.spacing       = 10;

    // ── Title ──────────────────────────────────────────────────
    var lblTitle = win.add("statictext", undefined, "MARKER NAVIGATOR");
    lblTitle.justify = "center";

    win.add("panel");

    // ── Nav Buttons ────────────────────────────────────────────
    var rowNav = win.add("group");
    rowNav.orientation   = "row";
    rowNav.alignment     = "center";
    rowNav.alignChildren = ["center", "center"];
    rowNav.spacing       = 8;

    var btnPrev = rowNav.add("button", undefined, "◀   Prev");
    btnPrev.preferredSize = [100, 32];
    btnPrev.helpTip = "Jump to previous marker  (Shift + Numpad 0)";

    var btnNext = rowNav.add("button", undefined, "Next   ▶");
    btnNext.preferredSize = [100, 32];
    btnNext.helpTip = "Jump to next marker  (Numpad 0)";

    // ── Timecode display ───────────────────────────────────────
    var lblTime = win.add("statictext", undefined, "——:——:——:——");
    lblTime.justify = "center";
    lblTime.graphics.font = ScriptUI.newFont("Courier New", "REGULAR", 13);

    // ── Position display  e.g. "Marker 3 / 8" ─────────────────
    var lblInfo = win.add("statictext", undefined, "—");
    lblInfo.justify = "center";

    win.add("panel");

    // ── Keyboard hint ──────────────────────────────────────────
    var lblHint = win.add("statictext", undefined,
        "Numpad 0 → next\nShift + Numpad 0 → prev\nNumpad * → add marker", { multiline: true });
    lblHint.justify = "center";
    lblHint.graphics.foregroundColor = lblHint.graphics.newPen(
        lblHint.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5, 1], 1);


    // ═══════════════════════════════════════════════════════════
    //  HELPERS
    // ═══════════════════════════════════════════════════════════

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    function formatTC(sec, fps) {
        var h = Math.floor(sec / 3600);
        var m = Math.floor((sec % 3600) / 60);
        var s = Math.floor(sec % 60);
        var f = Math.round((sec - Math.floor(sec)) * fps);
        return pad(h) + ":" + pad(m) + ":" + pad(s) + ":" + pad(f);
    }

    function getComp() {
        if (!app.project) return null;
        var c = app.project.activeItem;
        return (c instanceof CompItem) ? c : null;
    }

    function getMarkerTimes(comp) {
        var times = [];
        var mp = comp.markerProperty;
        for (var i = 1; i <= mp.numKeys; i++) times.push(mp.keyTime(i));
        times.sort(function(a, b) { return a - b; });
        return times;
    }

    // Snap currentIndex to the closest marker to the playhead,
    // so Prev/Next stay in sync if the user scrubs manually.
    function syncIndexToPlayhead(times, currentTime) {
        if (times.length === 0) return 0;
        var closest = 0;
        var minDiff = Math.abs(times[0] - currentTime);
        for (var i = 1; i < times.length; i++) {
            var diff = Math.abs(times[i] - currentTime);
            if (diff < minDiff) { minDiff = diff; closest = i; }
        }
        return closest;
    }

    function goToMarker(times, idx, comp) {
        if (times.length === 0) return;
        // Modulo wrap — this is what makes it truly infinite in both directions
        idx = ((idx % times.length) + times.length) % times.length;
        currentIndex = idx;

        comp.time    = times[idx];
        lblTime.text = formatTC(times[idx], comp.frameRate);
        lblInfo.text = "Marker " + (idx + 1) + " / " + times.length;
    }


    // ═══════════════════════════════════════════════════════════
    //  EVENTS
    // ═══════════════════════════════════════════════════════════

    btnNext.onClick = function() {
        var comp = getComp();
        if (!comp) { lblTime.text = "No comp open"; return; }
        var times = getMarkerTimes(comp);
        if (times.length === 0) { lblInfo.text = "No markers in comp"; return; }
        currentIndex = syncIndexToPlayhead(times, comp.time);
        goToMarker(times, currentIndex + 1, comp);
    };

    btnPrev.onClick = function() {
        var comp = getComp();
        if (!comp) { lblTime.text = "No comp open"; return; }
        var times = getMarkerTimes(comp);
        if (times.length === 0) { lblInfo.text = "No markers in comp"; return; }
        currentIndex = syncIndexToPlayhead(times, comp.time);
        goToMarker(times, currentIndex - 1, comp);
    };


    // ═══════════════════════════════════════════════════════════
    //  SHOW
    // ═══════════════════════════════════════════════════════════
    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }

})(this);