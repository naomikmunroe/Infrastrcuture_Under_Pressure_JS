// Phase 2 stub. Wires event presentation and player choice resolution to GameManager.

using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Events;

public class GameEventSystem : MonoBehaviour
{
    public EventData[] eventPool;

    public UnityEvent<EventData> OnEventTriggered;
    public UnityEvent<EventChoice> OnChoiceMade;

    public void TriggerEvent(EventData eventData)
    {
        OnEventTriggered?.Invoke(eventData);
    }

    public void ResolveChoice(EventChoice choice)
    {
        var effects = new Dictionary<string, int>
        {
            { "stability",  choice.stabilityDelta  },
            { "resources",  choice.resourcesDelta  },
            { "workload",   choice.workloadDelta   },
            { "confidence", choice.confidenceDelta },
        };

        GameManager.Instance.ApplyEffect(effects);
        OnChoiceMade?.Invoke(choice);
        GameManager.Instance.AdvanceTurn();
    }
}
