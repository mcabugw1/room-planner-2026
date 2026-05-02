# Pitch: Spatial Blueprint

## The Pitch: "Spatial Blueprint"

**Spatial Blueprint** is a high-precision, interactive environment designed to bridge the gap between a napkin sketch and a lived-in reality. Unlike generic floor planners, this application utilizes a **1:1 pixel-to-inch mapping system** to provide absolute spatial certainty.

The application allows users to instantly visualize furniture flow, clearance for door swings, and architectural constraints with a modern, high-performance interface built on **React 19 and Vite 6**. It is designed specifically for those who demand precision—whether planning a workstation layout or optimizing a workshop—ensuring every inch of a room is utilized before a single piece of furniture is moved.

---

## Roadmap to a "Fully Fledged" Project

To transition from a basic prototype to a production-grade application, the following technical and functional components are required:

### 1. Persistent Data Layer
A professional application needs to save and load different layouts and project states.
* **Database Integration**: Implementation of a backend (such as Supabase or PostgreSQL) to store furniture coordinates, room dimensions, and user configurations.
* **State Serialization**: A system to export layouts as JSON files, enabling local backups and easy sharing.

### 2. Advanced Layout Engine
Mechanical constraints turn a drawing tool into a planning tool.
* **Collision Detection**: Logic to prevent furniture blocks from overlapping or intersecting with structural walls.
* **Snap-to-Grid & Alignment**: Toggleable grids (e.g., 6-inch increments) and magnetic alignment to ensure objects sit flush against surfaces.
* **Clearance Zones**: Visual indicators (ghost boxes) representing the functional space required to operate furniture, such as chair pull-outs or door swings.

### 3. 3.D Visualization & Exporting
Adding volume to a 2D layout improves spatial awareness.
* **Three.js / React Three Fiber**: A 3D view toggle that extrudes 2D blocks into 3D models based on height attributes.
* **3.D Printing Export (STL)**: A feature to export the layout as an STL file for physical miniature fabrication.

### 4. Furniture Library & Customization
Replace generic blocks with a catalog of standard architectural items.
* **Asset Catalog**: A searchable sidebar of standard dimensions for common furniture (e.g., Queen Bed, standard desks).
* **Precise Modification**: A properties panel to input exact numerical values for Width, Depth, and Height.

### 5. Professional DevOps & CI/CD
Ensuring the project is maintainable and scalable.
* **Automated Testing**: Expanding the Vitest suite to include integration tests for complex movement and collision logic.
* **Containerized Deployment**: Finalizing multi-stage Docker builds to deploy to high-performance environments like Vercel or independent Nginx servers.
* **Agentic Maintenance**: Utilizing the CLAUDE.md and Skills framework to enable AI coding assistants to autonomously manage bug fixes and feature additions.

---

## Development Milestones

| Feature | Phase | Primary Technology |
| :--- | :--- | :--- |
| Core Drag & Drop | Phase 1 | React 19 / react-rnd |
| Project Saving | Phase 2 | Supabase / PostgreSQL |
| 3D View | Phase 3 | Three.js / React Three Fiber |
| Precision Snapping | Phase 4 | Custom Math Hooks |