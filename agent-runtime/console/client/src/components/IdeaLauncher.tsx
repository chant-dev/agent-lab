import { useState, type FormEvent } from "react";
import { Button, Field, Panel } from "./ui";

const priorities = ["Medium", "High", "Low", "Critical"];
const appTypes = ["Full-stack app", "Frontend app", "Backend service", "CLI tool", "Desktop app", "Automation script", "Other"];
const qualityLevels = ["Production", "Standard", "Experimental"];
const buildModes = ["standard", "lightweight", "production"];

export function IdeaLauncher({
  busy,
  onSubmit,
}: {
  busy: boolean;
  onSubmit: (payload: { idea: string; priority: string; appTypeHint: string; qualityLevel: string; buildMode: string }) => Promise<boolean>;
}) {
  const [idea, setIdea] = useState("");
  const [priority, setPriority] = useState(priorities[0]);
  const [appTypeHint, setAppTypeHint] = useState(appTypes[0]);
  const [qualityLevel, setQualityLevel] = useState(qualityLevels[0]);
  const [buildMode, setBuildMode] = useState(buildModes[0]);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const submitted = await onSubmit({ idea, priority, appTypeHint, qualityLevel, buildMode });
    if (submitted) {
      setIdea("");
      setMessage({ text: "Idea submitted through the AgentLab queue workflow.", tone: "success" });
    } else {
      setMessage({ text: "Idea was not added. Review the command output and error banner.", tone: "error" });
    }
  }

  return (
    <Panel title="Idea Launcher">
      <form className="space-y-4" onSubmit={submit}>
        <Field label="Rough app idea">
          <textarea
            value={idea}
            onChange={(event) => setIdea(event.target.value)}
            rows={6}
            minLength={10}
            required
            placeholder="Describe the app, workflow, target user, constraints, and anything the builder should preserve."
            className="min-h-36 w-full resize-y rounded-md border border-line bg-ink px-3 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-accent"
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-4">
          <Select label="Priority" value={priority} values={priorities} onChange={setPriority} />
          <Select label="App type" value={appTypeHint} values={appTypes} onChange={setAppTypeHint} />
          <Select label="Quality" value={qualityLevel} values={qualityLevels} onChange={setQualityLevel} />
          <Select label="Build mode" value={buildMode} values={buildModes} onChange={setBuildMode} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <Button type="submit" disabled={busy || idea.trim().length < 10}>{busy ? "Submitting" : "Add to queue"}</Button>
          {message && (
            <span className={`text-sm ${message.tone === "success" ? "text-accent" : "text-rose-200"}`}>
              {message.text}
            </span>
          )}
        </div>
      </form>
    </Panel>
  );
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-line bg-ink px-3 text-sm text-slate-100 outline-none focus:border-accent"
      >
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </Field>
  );
}
