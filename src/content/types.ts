/**
 * Shape of a single project in the gallery.
 * Only `slug` and `title` are required — every other field is optional and the
 * gallery adapts to whatever is present.
 */
export type ProjectStatus = 'live' | 'in-progress' | 'experiment' | 'archived';

export interface ProjectImage {
  /** Path or URL. Files in /public are referenced from the root: "/projects/my-app/cover.webp". */
  src: string;
  /** Describe what the image shows (screen readers read this). */
  alt: string;
  /** Intrinsic size. Optional, but helps the layout reserve space before the image loads. */
  width?: number;
  height?: number;
}

export interface Project {
  /** Unique, URL-safe id. Used for deep links: /#work/<slug> */
  slug: string;
  title: string;
  /** One or two sentences shown on the gallery label. */
  summary?: string;
  /** Long description for the detail view. Separate paragraphs with a blank line. */
  description?: string;
  cover?: ProjectImage;
  /** Additional screenshots shown in the detail view. */
  screenshots?: ProjectImage[];
  technologies?: string[];
  /** Free text, e.g. "Web app", "CLI", "Library". */
  category?: string;
  year?: number | string;
  status?: ProjectStatus;
  repository?: string;
  website?: string;
  /** Featured projects are mounted larger. */
  featured?: boolean;
  /** Lower numbers come first. Projects without `order` follow, newest year first. */
  order?: number;
  /** Keep a project in the file without showing it. */
  hidden?: boolean;
}
