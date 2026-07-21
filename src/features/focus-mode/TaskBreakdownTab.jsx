import { useState } from 'react';
import TaskInput from './components/TaskInput';
import TaskChecklist from './components/TaskChecklist';
import { sendMessage, buildSystemPrompt } from '../../shared/lib/aiClient';
import { logActivity } from '../../shared/lib/logActivity';
import useProfileStore from '../../store/useProfileStore';
import useFocusStore from './useFocusStore';

const stripMarkdown = (str) => {
    if (!str || typeof str !== 'string') return str || '';
    return str
        .replace(/\*\*(.*?)\*\*/g, '$1') // bold **text**
        .replace(/\*(.*?)\*/g, '$1')     // italic *text*
        .replace(/__(.*?)__/g, '$1')     // bold __text__
        .replace(/_(.*?)_/g, '$1')       // italic _text_
        .replace(/`(.*?)`/g, '$1')       // inline code `text`
        .replace(/#/g, '')               // headers
        .trim();
};

export default function TaskBreakdownTab({ onNavigateToFocus }) {
    const userId = useProfileStore((s) => s.id);
    const profile = useProfileStore((s) => s);

    // Persisted task breakdown state from store (individual primitive selectors)
    const taskTitle = useFocusStore((s) => s.taskTitle);
    const steps = useFocusStore((s) => s.steps);
    const completedStepIds = useFocusStore((s) => s.completedStepIds);

    const setBreakdown = useFocusStore((s) => s.setBreakdown);
    const toggleStepCompleted = useFocusStore((s) => s.toggleStepCompleted);
    const clearBreakdown = useFocusStore((s) => s.clearBreakdown);

    // Transient UI state
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    // Fallback generator if API call fails
    const generateFallbackSteps = (promptText) => {
        const cleanPrompt = stripMarkdown(promptText);
        return [
            { id: 1, title: 'Gather initial materials & clear workspace', estMinutes: 5, description: 'Remove distractions and get everything ready.' },
            { id: 2, title: `Start the core phase of "${cleanPrompt.slice(0, 30)}"`, estMinutes: 15, description: 'Focus on step 1 without worrying about the full result.' },
            { id: 3, title: 'Take a quick 2-minute stretch & review', estMinutes: 2, description: 'Check your progress so far.' },
            { id: 4, title: 'Finish remaining details & tidy up', estMinutes: 10, description: 'Wrap up the final tasks and celebrate completing it!' },
        ];
    };

    const handleGenerateBreakdown = async (promptText) => {
        setIsLoading(true);
        setErrorMsg(null);
        const cleanTitle = stripMarkdown(promptText);

        try {
            const systemPrompt = buildSystemPrompt(profile);
            const userPrompt = `Break down the following task into 3-5 short, actionable, ADHD-friendly steps. Each step must have a clear title, estimated minutes, and 1 sentence description. Return ONLY valid JSON format array:
[
  {"id": 1, "title": "Step title", "estMinutes": 5, "description": "Short explanation"}
]
Task to break down: "${cleanTitle}"`;

            const reply = await sendMessage(systemPrompt, [{ role: 'user', content: userPrompt }]);
            const cleanedJson = reply.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedSteps = JSON.parse(cleanedJson);

            if (Array.isArray(parsedSteps) && parsedSteps.length > 0) {
                const sanitizedSteps = parsedSteps.map((step) => ({
                    ...step,
                    title: stripMarkdown(step.title),
                    description: stripMarkdown(step.description),
                }));
                setBreakdown(cleanTitle, sanitizedSteps);
            } else {
                setBreakdown(cleanTitle, generateFallbackSteps(cleanTitle));
            }
        } catch (err) {
            console.error('[TaskBreakdown] Error:', err);
            setBreakdown(cleanTitle, generateFallbackSteps(cleanTitle));
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleStep = async (step) => {
        const isDone = completedStepIds.includes(step.id);
        toggleStepCompleted(step.id);

        // If newly completed, log activity event
        if (!isDone) {
            await logActivity(userId, 'task_completed', {
                title: step.title,
                task: taskTitle,
            });
        }
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            <div className="text-center max-w-xs mx-auto">
                <h2 className="text-base-md font-bold text-gray-800 dark:text-gray-100">
                    AI Task Breakdown
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                    Enter any large task and Gemini will break it into tiny, doable steps.
                </p>
            </div>

            <TaskInput onGenerateBreakdown={handleGenerateBreakdown} isLoading={isLoading} />

            {errorMsg && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                    {errorMsg}
                </div>
            )}

            <TaskChecklist
                steps={steps}
                completedStepIds={completedStepIds}
                onToggleStep={handleToggleStep}
                taskTitle={taskTitle}
                onNavigateToFocus={onNavigateToFocus}
                onClearBreakdown={clearBreakdown}
            />
        </div>
    );
}
