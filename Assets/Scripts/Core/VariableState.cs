// Phase 2+ stub. All variable state is owned by GameManager in Phase 1.
// This component will act as a read-only view for UI panels in later phases.

using UnityEngine;

public class VariableState : MonoBehaviour
{
    public int Stability  => GameManager.Instance.Stability;
    public int Resources  => GameManager.Instance.Resources;
    public int Workload   => GameManager.Instance.Workload;
    public int Confidence => GameManager.Instance.Confidence;
}
