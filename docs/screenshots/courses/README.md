# Courses: the frame budget

Rewritten for Telo Ride 1: one course, Ibiza Sunset Strip. The seven other maps' rows went with slice 30.1.

L2-166 AC12 sets a budget for low-power tablets: in the worst frame along a course no more than **120,000
triangles** and **140 draw calls**, and a map file of no more than **3 MB gzipped**.

The check runs the real `CourseRenderer` on the map's real glb in headless Chrome, at the tier a ride opens on,
at 16 places along the course, with a pack of six riders, and reads what the renderer sent the GPU. It is a budget,
not a frame rate: it was drawn in software with no GPU, and **nothing here has been timed on a real tablet**.

| Map | Worst frame: triangles | Draw calls | File, gzipped | Within the budget |
| --- | --- | --- | --- | --- |
| `ibiza` | 109,821 | 124 | 2.53 MB | Yes |

Before the map was cut into chunks, every frame drew the whole map: 350,829 triangles (pass 0).
`ibiza/README.md` logs the passes that brought Ibiza Sunset Strip within the budget.
