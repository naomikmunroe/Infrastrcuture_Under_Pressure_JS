using UnityEngine;

public class VariableState : MonoBehaviour
{
    public static VariableState Instance { get; private set; }

    [Range(0, 100)] public float SystemStability = 80f;
    [Range(0, 100)] public float ResourceReserves = 60f;
    [Range(0, 100)] public float AttentionLoad = 20f;
    [Range(0, 100)] public float PublicPressure = 10f;

    private void Awake()
    {
        if (Instance != null && Instance != this) { Destroy(gameObject); return; }
        Instance = this;
    }

    public void ApplyDelta(float stability, float resources, float attention, float pressure)
    {
        SystemStability = Mathf.Clamp(SystemStability + stability, 0, 100);
        ResourceReserves = Mathf.Clamp(ResourceReserves + resources, 0, 100);
        AttentionLoad = Mathf.Clamp(AttentionLoad + attention, 0, 100);
        PublicPressure = Mathf.Clamp(PublicPressure + pressure, 0, 100);
    }
}
