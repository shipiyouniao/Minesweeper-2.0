/** Show the same run clue with one or three safe squares separating its mine groups. */
export function surveyRunExamplesTemplate(): string {
  const mine = '<span>⚑</span>'
  const safe = '<span class="survey-example-safe">·</span>'
  return `<div class="survey-examples" aria-hidden="true">${[1, 3]
    .map(
      (gap) =>
        `<div class="survey-example"><strong>2 1</strong>${mine}${mine}${safe.repeat(gap)}${mine}</div>`,
    )
    .join('')}</div>`
}
