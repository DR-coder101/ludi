# Diff-on-failure demo

`ludi screens check` writes `<id>.diff.png` next to the capture when pixels drift past 0.5%.

`home.diff.png` here is that output for a deliberate mismatch: `baselines/web/lobby.png` compared as if it were the home screen. Magenta is changed pixels. Pink overlay is the usual pixelmatch visualization.

A passing run writes no diff files and reports `pixels_differ: 0`.
