import assert from "node:assert/strict";
import test from "node:test";

import { secToTimecode } from "./timecode.js";

test("formats non-drop-frame timecode", () => {
    assert.equal(secToTimecode(1, 30, false), "00:00:01:00");
});

test("formats 29.97 drop-frame timecode without emitting dropped frame numbers", () => {
    assert.equal(secToTimecode(60, 29.97, true), "00;00;59;28");
    assert.equal(secToTimecode(3598 / 29.97, 29.97, true), "00;02;00;02");
    assert.equal(secToTimecode(17982 / 29.97, 29.97, true), "00;10;00;00");
    assert.equal(secToTimecode(107892 / 29.97, 29.97, true), "01;00;00;00");
});

test("formats 59.94 drop-frame timecode without emitting dropped frame numbers", () => {
    assert.equal(secToTimecode(7196 / 59.94, 59.94, true), "00;02;00;04");
    assert.equal(secToTimecode(35964 / 59.94, 59.94, true), "00;10;00;00");
    assert.equal(secToTimecode(215784 / 59.94, 59.94, true), "01;00;00;00");
});

test("falls back to non-drop formatting for unsupported frame rates", () => {
    assert.equal(secToTimecode(60, 24, true), "00:01:00:00");
});
