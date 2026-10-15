## 2024-10-15 - Improve Flashcard Screen Reader Status and Tooltips
**Learning:** For dynamic feedback areas and recording state indicators, adding `role="status"` is crucial so screen readers can announce changes as they happen. Also, dynamic `title` attributes on buttons to explain why they are disabled greatly enhance accessibility for visual users.
**Action:** Always verify if a visual indicator or message needs to be announced to assistive technologies when it changes state.
