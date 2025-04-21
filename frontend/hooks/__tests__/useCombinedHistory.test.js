// 📁 frontend/hooks/__tests__/useCombinedHistory.test.js
import { renderHook } from '@testing-library/react-hooks';
import useCombinedHistory from '../useCombinedHistory';

const mockHistory = [
  { date: '2024-03-21', price: 100 },
  { date: '2024-03-22', price: 110 },
  { date: '2024-03-23', price: 120 }
];

const mockFetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        currency: 'EUR',
        history: mockHistory
      })
  })
);

describe('useCombinedHistory', () => {
  beforeEach(() => {
    global.fetch = mockFetch;
    localStorage.clear();
  });

  it('fetches and combines historical data correctly', async () => {
    const assets = [
      { id: 'btc', name: 'Bitcoin', type: 'crypto', initialQty: 1, initialCost: 100 },
      { id: 'eth', name: 'Ethereum', type: 'crypto', initialQty: 2, initialCost: 50 }
    ];

    const { result, waitForNextUpdate } = renderHook(() =>
      useCombinedHistory(assets, {})
    );

    await waitForNextUpdate();

    const { history, multiHistory, convertedInitial, loading } = result.current;

    expect(loading).toBe(false);
    expect(history.length).toBeGreaterThan(0);
    expect(multiHistory.length).toBe(2);
    expect(convertedInitial).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[0][0]).toContain('/api/history?id=btc');
    expect(fetch.mock.calls[1][0]).toContain('/api/history?id=eth');
  });
});
