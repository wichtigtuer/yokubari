// Replay fixtures describe a scripted run: an ordered list of logical-tick steps. Each step
// Optionally carries one raw input to dispatch before the ticks. Parsing returns a typed Result and
// Never throws, so a malformed fixture fails the test with a readable message.
interface ReplayStep {
    frames?: number;
    input?: string;
}

interface ReplayFixture {
    name: string;
    steps: ReplayStep[];
}

type FixtureResult = { error: string; type: 'error' } | { type: 'ok'; value: ReplayFixture };

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const parseStep = (json: unknown): ReplayStep | undefined => {
    if (!isRecord(json)) {
        return undefined;
    }
    const step: ReplayStep = {};
    if ('frames' in json) {
        if (typeof json.frames !== 'number' || !Number.isInteger(json.frames) || json.frames < 0) {
            return undefined;
        }
        step.frames = json.frames;
    }
    if ('input' in json) {
        if (typeof json.input !== 'string') {
            return undefined;
        }
        step.input = json.input;
    }
    if (step.frames === undefined && step.input === undefined) {
        return undefined;
    }
    return step;
};

const parseReplayFixture = (json: unknown): FixtureResult => {
    if (!isRecord(json) || typeof json.name !== 'string' || !Array.isArray(json.steps)) {
        return { error: 'fixture must be an object with a string "name" and a "steps" array', type: 'error' };
    }
    const steps: ReplayStep[] = [];
    for (const [index, stepJson] of json.steps.entries()) {
        const step = parseStep(stepJson);
        if (!step) {
            return {
                error: `step ${index} must carry a non-negative integer "frames" and/or a string "input"`,
                type: 'error'
            };
        }
        steps.push(step);
    }
    return { type: 'ok', value: { name: json.name, steps } };
};

export { parseReplayFixture, type FixtureResult, type ReplayFixture, type ReplayStep };
