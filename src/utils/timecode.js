/**
 * Converts seconds to an SMPTE timecode string.
 * @param {number} sec - Time in seconds
 * @param {number} fps - Frames per second (e.g. 23.976, 29.97, 30, 60)
 * @param {boolean} drop - Whether to use Drop-Frame timecode (for 29.97/59.94)
 * @returns {string} HH:MM:SS:FF for NDF or HH;MM;SS;FF for DF
 */
export function secToTimecode(sec, fps, drop = false) {
    const frames = Math.round(sec * fps);
    const nominalFps = Math.round(fps);
    const is2997 = Math.abs(fps - 29.97) < 0.01;
    const is5994 = Math.abs(fps - 59.94) < 0.01;
    const useDropFrame = drop && (is2997 || is5994);

    if (!useDropFrame) {
        const f = frames % nominalFps;
        const totalSec = Math.floor(frames / fps);
        const s = totalSec % 60;
        const m = Math.floor(totalSec / 60) % 60;
        const h = Math.floor(totalSec / 3600);
        return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(':');
    }

    // Skip 2 frame numbers at 29.97 (4 at 59.94) at each minute boundary,
    // except every tenth minute. Convert elapsed frames to numbered TC frames.
    const droppedFramesPerMinute = is5994 ? 4 : 2;
    const framesPerMinute = nominalFps * 60 - droppedFramesPerMinute;
    const framesPerTenMinutes = nominalFps * 60 * 10 - droppedFramesPerMinute * 9;
    const tenMinuteChunks = Math.floor(frames / framesPerTenMinutes);
    const remainingFrames = frames % framesPerTenMinutes;

    let droppedFrameNumbers = droppedFramesPerMinute * 9 * tenMinuteChunks;
    if (remainingFrames >= droppedFramesPerMinute) {
        droppedFrameNumbers += droppedFramesPerMinute
            * Math.floor((remainingFrames - droppedFramesPerMinute) / framesPerMinute);
    }

    const timecodeFrames = frames + droppedFrameNumbers;
    const f = timecodeFrames % nominalFps;
    const totalSec = Math.floor(timecodeFrames / nominalFps);
    const s = totalSec % 60;
    const m = Math.floor(totalSec / 60) % 60;
    const h = Math.floor(totalSec / 3600);

    return [h, m, s, f].map(v => String(v).padStart(2, '0')).join(';');
}
