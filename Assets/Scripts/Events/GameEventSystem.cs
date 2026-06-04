using System.Collections.Generic;
using System.Linq;
using UnityEngine;
using UnityEngine.Events;

public class GameEventSystem : MonoBehaviour
{
    public EventData[] eventPool;

    // Needed to resolve condition-specific effects on the T6 Follow AI action
    [SerializeField] private AIBehaviour _aiBehaviour;

    public UnityEvent<EventData> OnEventTriggered;
    public UnityEvent<EventChoice> OnChoiceMade;

    public void TriggerEvent(EventData eventData)
    {
        OnEventTriggered?.Invoke(eventData);
    }

    public void ResolveChoice(EventChoice choice)
    {
        // Determine immediate deltas — pushy override applies only to the Follow AI action
        int stability  = choice.stabilityDelta;
        int resources  = choice.resourcesDelta;
        int workload   = choice.workloadDelta;
        int confidence = choice.confidenceDelta;

        if (choice.isFollowAIAction && _aiBehaviour != null && _aiBehaviour.condition == AICondition.Pushy)
        {
            stability  = choice.pushyStabilityDelta;
            resources  = choice.pushyResourcesDelta;
            workload   = choice.pushyWorkloadDelta;
            confidence = choice.pushyConfidenceDelta;
        }

        GameManager.Instance.ApplyEffect(new Dictionary<string, int>
        {
            { "stability",  stability  },
            { "resources",  resources  },
            { "workload",   workload   },
            { "confidence", confidence },
        });

        // Register delayed effect if any delta is non-zero and a target turn is set
        if (choice.delayedTurn > 0)
        {
            var delayed = new Dictionary<string, int>
            {
                { "stability",  choice.delayedStabilityDelta  },
                { "resources",  choice.delayedResourcesDelta  },
                { "workload",   choice.delayedWorkloadDelta   },
                { "confidence", choice.delayedConfidenceDelta },
            };
            if (delayed.Values.Any(v => v != 0))
                GameManager.Instance.RegisterDelayedEffect(choice.delayedTurn, delayed);
        }

        if (choice.activatesEscalateModifier)
            GameManager.Instance.EscalateModifierActive = true;

        OnChoiceMade?.Invoke(choice);
        GameManager.Instance.AdvanceTurn();
    }
}
