# Stop buttons moving on hover

Buttons stay in place when hovered. They still darken slightly so it's clear they can be clicked.

## Technical details
In `src/styles.css` (line 226), remove `transform: translateY(-1px);` from the brand button hover rule. Keep the background colour change.
