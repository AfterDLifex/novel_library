import {
  Directive,
  ElementRef,
  Renderer2,
  OnDestroy
} from '@angular/core';

/**
 * Directive that adds a shadow class to the host element
 * when it is scrolled away from the top.
 */
@Directive({
  selector: '[appScrollShadow]',
  standalone: true,
})
export class ScrollShadowDirective implements OnDestroy {
  private scrollHandler: (() => void) | null = null;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
  ) {
    const element = this.el.nativeElement;

    // Base shadow class
    this.renderer.addClass(element, 'scroll-shadow');

    this.scrollHandler = () => {
      const hasShadow = element.scrollTop > 4;

      if (hasShadow) {
        this.renderer.addClass(element, 'scrolled');
      } else {
        this.renderer.removeClass(element, 'scrolled');
      }
    };

    element.addEventListener(
      'scroll',
      this.scrollHandler,
      { passive: true }
    );

    // Set the initial state
    this.scrollHandler();
  }

  ngOnDestroy(): void {
    if (this.scrollHandler) {
      this.el.nativeElement.removeEventListener(
        'scroll',
        this.scrollHandler
      );

      this.scrollHandler = null;
    }
  }
}