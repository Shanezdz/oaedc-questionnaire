import { put } from "@vercel/blob";
import fields from "./fields.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_SIZE = 200_000;
const MAX_TEXT_LENGTH = 10_000;

type FieldSpec = {
  type: string;
  required: boolean;
  values?: string[];
  max?: number;
};

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: "Origin refusée" }, { status: 403 });
  }

  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_SIZE) {
      return Response.json({ error: "Réponse trop longue" }, { status: 413 });
    }

    const payload: unknown = JSON.parse(raw);
    if (!isPayload(payload)) {
      return Response.json({ error: "Format invalide" }, { status: 400 });
    }

    const clean: Record<string, string | string[]> = {};

    for (const [name, spec] of Object.entries(fields) as [string, FieldSpec][]) {
      const value = payload.answers[name];

      if (
        spec.required &&
        (value === undefined ||
          value === "" ||
          (Array.isArray(value) && value.length === 0))
      ) {
        return Response.json(
          { error: "Champ obligatoire", field: name },
          { status: 400 },
        );
      }

      if (value === undefined) continue;

      if (spec.type === "checkbox") {
        const values = Array.isArray(value) ? value : [value];
        if (
          values.length > (spec.max ?? 99) ||
          new Set(values).size !== values.length ||
          values.some(
            (item) =>
              typeof item !== "string" || !spec.values?.includes(item),
          )
        ) {
          return Response.json(
            { error: "Choix invalide", field: name },
            { status: 400 },
          );
        }
        clean[name] = values as string[];
        continue;
      }

      if (
        typeof value !== "string" ||
        value.length > MAX_TEXT_LENGTH ||
        (spec.required && !value.trim()) ||
        (spec.values && !spec.values.includes(value))
      ) {
        return Response.json(
          { error: "Réponse invalide", field: name },
          { status: 400 },
        );
      }

      clean[name] = value.trim();
    }

    const record = {
      id: payload.id,
      createdAt: new Date().toISOString(),
      answers: clean,
    };

    await put(`responses/${payload.id}.json`, JSON.stringify(record), {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
    });

    return Response.json({ saved: true }, { status: 201 });
  } catch (error) {
    console.error("Unable to save questionnaire response", error);
    return Response.json(
      { error: "Enregistrement impossible. Veuillez réessayer." },
      { status: 500 },
    );
  }
}

function isPayload(
  value: unknown,
): value is { id: string; answers: Record<string, unknown> } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    /^[0-9a-f-]{36}$/i.test(candidate.id) &&
    !!candidate.answers &&
    typeof candidate.answers === "object" &&
    !Array.isArray(candidate.answers)
  );
}
