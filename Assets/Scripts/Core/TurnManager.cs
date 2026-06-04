// Phase 2+ stub. Turn advancement is handled by GameManager.AdvanceTurn() in Phase 1.
// This component will coordinate UI transitions and event presentation in later phases.

using UnityEngine;
using UnityEngine.Events;

public class TurnManager : MonoBehaviour
{
    public UnityEvent<int> OnTurnStarted;
    public UnityEvent OnSessionEnded;

    private void OnEnable()
    {
        GameManager.Instance.OnGameOver += HandleGameOver;
    }

    private void OnDisable()
    {
        if (GameManager.Instance != null)
            GameManager.Instance.OnGameOver -= HandleGameOver;
    }

    private void HandleGameOver()
    {
        OnSessionEnded?.Invoke();
    }
}
