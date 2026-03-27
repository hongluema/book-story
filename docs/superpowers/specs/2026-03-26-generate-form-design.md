# Generate form and generate page updates

## Context
- Task 7 focuses on wiring up the UI for the generate page, specifically embedding a reusable `GenerateForm` that captures the prompt title (“一键生成睡前故事”), placeholder copy, and the four themed buttons (刷牙、分享、勇敢、睡觉习惯). The current page is just a heading and placeholder copy.
- The goal is to prepare the shape of the UI so the future Task 10 can hook it into the fetch flow. No API calls or story generation logic will land in this task.

## Requirements
1. The route must render the existing title, supporting copy, and the new form with placeholder text `比如：想听一个关于小熊刷牙睡觉的故事`.
2. A `GenerateForm` component should expose the four theme buttons, a controlled input, and a submit button. The buttons should visually highlight when the theme is selected; the current assumption is that they only control the selected topic and do not auto-fill or override the text input.
3. Tests must cover the page rendering the title, placeholder, and have at least a cursory assertion that the form/buttons are present.

## Architecture
- **`GenerateForm` component:** controlled inputs for `prompt` and `selectedTopic`, a list of theme options, and a submit handler that currently only prevents default and optionally notifies a noop `onSubmit` prop with `{ topic, prompt }`. The selected button has a unique style so the user knows which topic is active.
- **Page integration:** `app/generate/page.tsx` renders a structured page similar to the existing layout (center column, soft card). It imports and renders `GenerateForm`, passing a placeholder handler that logs or no-ops until Task 10 conducts the actual `fetch`.

## UI and Behavior Details
- Use the existing typography and spacing tokens (`text-starlight`, `rounded-xl`, `bg-night/60` etc.) so the new form matches the rest of the experience.
- The form sits within a lightly elevated card, stacking the theme buttons in a responsive grid, the text input full-width below, and a submit button aligned to the right.
- The input uses the required placeholder, and there is a short helper subtext (“描述你想听的小熊睡前故事”) to keep the panel friendly. Theme buttons use `aria-pressed` or similar to communicate selection.

## State Flow and Future Readiness
- `selectedTopic` is tracked in local component state so future tasks can read it before POSTing to `/api/generate-story`.
- The submit handler currently prevents default form submission, resets the form (if appropriate), and calls a passed `onSubmit` prop where Task 10 will plug in the fetch call.
- The page collects the layout, form, and tests so that Task 10 has clear hooks to consume the topic/prompt pair.

## Testing plan
- `tests/app/generate-page.test.tsx` should render the page, assert the header text, check that the input placeholder is correct, and verify the new form (via buttons or form role) is present on screen.
- No API interactions are exercised in this test; the focus is the static UI contract.

## Unknowns & Assumptions
- Assumed the buttons only select a topic and do not auto-fill the prompt value. The user can correct this when the spec is reviewed.
- The submit handler will remain a noop until Task 10. If needed sooner, Task 7 can be revisited.
