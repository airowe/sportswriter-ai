export function formatSamples(samples: { prompt: string; response: string }[]) {
  return samples.map((s) =>
    JSON.stringify({
      messages: [
        { role: 'user', content: s.prompt },
        { role: 'assistant', content: s.response },
      ],
    })
  ).join('\n');
}
