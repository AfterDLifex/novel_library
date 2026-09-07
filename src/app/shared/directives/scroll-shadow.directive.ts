import { Directive, ElementRef, Renderer2, OnDestroy } from '@angular/core';

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
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    this.renderer.addClass(this.el.nativeElement, 'scroll-shadow');
    this.scrollHandler = () => {
      const hasShadow = this.el.nativeElement.scrollTop > 4;
      this.renderer.toggleClass(this.el.nativeElement, 'scrolled', hasShadow);
    };
    this.el.nativeElement.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  ngOnDestroy() {
    if (this.scrollHandler) {
      this.el.nativeElement.removeEventListener('scroll', this.scrollHandler);
    }
  }
}
