/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {Component, TemplateRef, ViewChild, ViewContainerRef} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {expect} from '@angular/platform-browser/testing/src/matchers';
import {ivyEnabled, onlyInIvy} from '@angular/private/testing';

describe('TemplateRef', () => {
  describe('rootNodes', () => {

    @Component({template: `<ng-template #templateRef></ng-template>`})
    class App {
      @ViewChild('templateRef', {static: true})
      templateRef !: TemplateRef<any>;
      minutes = 0;
    }

    function getRootNodes(template: string): any[] {
      TestBed.configureTestingModule({
        declarations: [App],
      });
      TestBed.overrideTemplate(App, template);
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const embeddedView = fixture.componentInstance.templateRef.createEmbeddedView({});
      embeddedView.detectChanges();

      return embeddedView.rootNodes;
    }


    it('should return root render nodes for an embedded view instance', () => {
      const rootNodes =
          getRootNodes(`<ng-template #templateRef><div></div>some text<span></span></ng-template>`);
      expect(rootNodes.length).toBe(3);
    });

    /**
     * This is different as compared to the view engine implementation which returns a comment node
     * in this case:
     * https://stackblitz.com/edit/angular-uiqry6?file=src/app/app.component.ts
     *
     * Returning a comment node for a template ref with no nodes is wrong is fixed in Ivy.
     */
    onlyInIvy('Fixed: Ivy no longer adds a comment node in this case.')
        .it('should return an empty array for embedded view with no nodes', () => {
          const rootNodes = getRootNodes('<ng-template #templateRef></ng-template>');
          expect(rootNodes.length).toBe(0);
        });

    it('should include projected nodes', () => {
      @Component({
        selector: 'menu-content',
        template: `
              <ng-template>
                Header
                <ng-content></ng-content>
              </ng-template>
            `,
        exportAs: 'menuContent'
      })
      class MenuContent {
        @ViewChild(TemplateRef, {static: true}) template !: TemplateRef<any>;
      }

      @Component({
        template: `
              <menu-content #menu="menuContent">
                <button>Item one</button>
                <button>Item two</button>
              </menu-content>
            `
      })
      class App {
        @ViewChild(MenuContent) content !: MenuContent;

        constructor(public viewContainerRef: ViewContainerRef) {}
      }

      TestBed.configureTestingModule({declarations: [MenuContent, App]});
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      const instance = fixture.componentInstance;
      const viewRef = instance.viewContainerRef.createEmbeddedView(instance.content.template);
      const rootNodeTextContent = viewRef.rootNodes.map(node => node && node.textContent.trim())
                                      .filter(text => text !== '');

      expect(rootNodeTextContent).toEqual(['Header', 'Item one', 'Item two']);
    });

    it('should descend into view containers on ng-template', () => {
      /**
       * NOTE: In VE, if `SUFFIX` text node below is _not_ present, VE will add an
       * additional `<!---->` comment, thus being slightly different than Ivy.
       * (resulting in 1 root node in Ivy and 2 in VE).
       */
      const rootNodes = getRootNodes(`
      <ng-template #templateRef>
        <ng-template [ngIf]="true">text|</ng-template>SUFFIX
      </ng-template>`);

      expect(rootNodes.length).toBe(3);
      expect(rootNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(rootNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(rootNodes[2].nodeType).toBe(Node.TEXT_NODE);
    });

    it('should descend into view containers on an element', () => {
      /**
       * NOTE: In VE, if `SUFFIX` text node below is _not_ present, VE will add an
       * additional `<!---->` comment, thus being slightly different than Ivy.
       * (resulting in 1 root node in Ivy and 2 in VE).
       */
      const rootNodes = getRootNodes(`
      <ng-template #dynamicTpl>text</ng-template>
      <ng-template #templateRef>
        <div [ngTemplateOutlet]="dynamicTpl"></div>SUFFIX
      </ng-template>
    `);

      expect(rootNodes.length).toBe(3);
      expect(rootNodes[0].nodeType).toBe(Node.ELEMENT_NODE);
      expect(rootNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(rootNodes[2].nodeType).toBe(Node.TEXT_NODE);
    });

    it('should descend into view containers on ng-container', () => {
      /**
       * NOTE: In VE, if `SUFFIX` text node below is _not_ present, VE will add an
       * additional `<!---->` comment, thus being slightly different than Ivy.
       * (resulting in 1 root node in Ivy and 2 in VE).
       */
      const rootNodes = getRootNodes(`
          <ng-template #dynamicTpl>text</ng-template>
          <ng-template #templateRef><ng-container [ngTemplateOutlet]="dynamicTpl"></ng-container>SUFFIX</ng-template>
        `);

      expect(rootNodes.length).toBe(3);
      expect(rootNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(rootNodes[1].nodeType).toBe(Node.TEXT_NODE);
      expect(rootNodes[2].nodeType).toBe(Node.TEXT_NODE);
    });

    it('should descend into element containers', () => {
      const rootNodes = getRootNodes(`
          <ng-template #templateRef>
            <ng-container>text</ng-container>
          </ng-template>
        `);

      expect(rootNodes.length).toBe(2);
      expect(rootNodes[0].nodeType).toBe(Node.COMMENT_NODE);
      expect(rootNodes[1].nodeType).toBe(Node.TEXT_NODE);
    });

    it('should descend into ICU containers', () => {
      const rootNodes = getRootNodes(`
          <ng-template #templateRef>
            <ng-container i18n>Updated {minutes, select, =0 {just now} other {some time ago}}</ng-container>
          </ng-template>
        `);

      if (ivyEnabled) {
        expect(rootNodes.length).toBe(4);
        expect(rootNodes[0].nodeType).toBe(Node.COMMENT_NODE);  // ng-container
        expect(rootNodes[1].nodeType).toBe(Node.TEXT_NODE);     // "Updated " text
        expect(rootNodes[2].nodeType).toBe(Node.COMMENT_NODE);  // ICU container
        expect(rootNodes[3].nodeType).toBe(Node.TEXT_NODE);     // "one minute ago" text
      } else {
        // ViewEngine seems to produce very different DOM structure as compared to ivy
        // when it comes to ICU containers - this needs more investigation / fix.
        expect(rootNodes.length).toBe(7);
      }
    });
  });
});
