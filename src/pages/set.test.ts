import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

describe('getStaticPaths', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        // Mock console.error
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns correct paths based on valid words.json', async () => {
        vi.doMock('../data/words.json', () => ({
            default: {
                weeks: [
                    { set: '1st Set', words: ['a', 'b'] },
                    { set: '2nd Set', words: ['c', 'd'] }
                ]
            }
        }));

        const { getStaticPaths } = await import('./[set].astro');
        const paths = getStaticPaths();

        expect(paths).toEqual([
            { params: { set: '1st Set' }, props: { weekWords: ['a', 'b'] } },
            { params: { set: '2nd Set' }, props: { weekWords: ['c', 'd'] } }
        ]);
        expect(console.error).not.toHaveBeenCalled();
    });

    it('returns empty array and logs error when weeks is not an array', async () => {
        vi.doMock('../data/words.json', () => ({
            default: {
                weeks: 'not an array'
            }
        }));

        const { getStaticPaths } = await import('./[set].astro');
        const paths = getStaticPaths();

        expect(paths).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Invalid words data');
    });

    it('returns empty array and logs error when wordsData is falsy', async () => {
        vi.doMock('../data/words.json', () => ({
            default: null
        }));

        const { getStaticPaths } = await import('./[set].astro');
        const paths = getStaticPaths();

        expect(paths).toEqual([]);
        expect(console.error).toHaveBeenCalledWith('Invalid words data');
    });
});
