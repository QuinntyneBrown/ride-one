import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { CLASS_API } from '@wattzup/api';
import { LiveStateService } from '../../core/live-state.service';
import { type World, worldById } from '../../core/worlds';

/** Route `/classes/:id/world`: the ride in progress of class `:id` in that class's scene (L2-090). */
@Component({
  selector: 'wz-world-ride-page',
  templateUrl: './world-ride-page.html',
  styleUrl: './world-ride-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldRidePage {
  /** The route's `:id`. */
  readonly id = input.required<string>();

  private readonly classes = inject(CLASS_API);
  private readonly title = inject(Title);
  private readonly live = inject(LiveStateService);

  protected readonly world = signal<World | null>(null);

  constructor() {
    this.live.ensureStarted();
    effect(() => {
      const id = this.id();
      untracked(() => void this.load(id));
    });
  }

  private async load(id: string): Promise<void> {
    const entry = await this.classes.get(id);
    if (entry === 'not-found' || !entry.world) return;
    const world = worldById(entry.world);
    this.world.set(world);
    this.title.setTitle(world.name);
  }
}
