/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {CommonModule} from '@angular/common';
import {CUSTOM_ELEMENTS_SCHEMA, Component, NO_ERRORS_SCHEMA, NgModule} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {modifiedInIvy, onlyInIvy} from '@angular/private/testing';

describe('NgModule', () => {
  @Component({template: 'hello'})
  class TestCmp {
  }

  @Component({template: 'hello'})
  class TestCmp2 {
  }

  describe('entryComponents', () => {
    it('should throw when specified entry component is not added to a module', () => {
      @NgModule({entryComponents: [TestCmp, [TestCmp2]]})
      class MyModule {
      }

      TestBed.configureTestingModule({imports: [MyModule]});

      expect(() => {
        TestBed.createComponent(TestCmp);
        TestBed.createComponent(TestCmp2);
      }).toThrowError(/not part of any NgModule/);
    });

    it('should not throw when specified entry component is added to a module', () => {
      @NgModule({declarations: [TestCmp, TestCmp2], entryComponents: [TestCmp, [TestCmp2]]})
      class MyModule {
      }

      TestBed.configureTestingModule({imports: [MyModule]});

      expect(() => {
        TestBed.createComponent(TestCmp);
        TestBed.createComponent(TestCmp2);
      }).not.toThrow();
    });
  });

  describe('bootstrap', () => {
    it('should throw when specified bootstrap component is not added to a module', () => {
      @NgModule({bootstrap: [TestCmp, [TestCmp2]]})
      class MyModule {
      }

      TestBed.configureTestingModule({imports: [MyModule]});

      expect(() => {
        TestBed.createComponent(TestCmp);
        TestBed.createComponent(TestCmp2);
      }).toThrowError(/not part of any NgModule/);
    });

    it('should not throw when specified bootstrap component is added to a module', () => {
      @NgModule({declarations: [TestCmp, TestCmp2], bootstrap: [TestCmp, [TestCmp2]]})
      class MyModule {
      }

      TestBed.configureTestingModule({imports: [MyModule]});

      expect(() => {
        TestBed.createComponent(TestCmp);
        TestBed.createComponent(TestCmp2);
      }).not.toThrow();
    });
  });

  describe('schemas', () => {
    onlyInIvy('Unknown property warning logged instead of throwing an error')
        .it('should throw on unknown props if NO_ERRORS_SCHEMA is absent', () => {
          @Component({
            selector: 'my-comp',
            template: `
              <ng-container *ngIf="condition">
                <div [unknown-prop]="true"></div>
              </ng-container>
            `,
          })
          class MyComp {
            condition = true;
          }

          @NgModule({
            imports: [CommonModule],
            declarations: [MyComp],
          })
          class MyModule {
          }

          TestBed.configureTestingModule({imports: [MyModule]});

          const spy = spyOn(console, 'warn');
          const fixture = TestBed.createComponent(MyComp);
          fixture.detectChanges();
          expect(spy.calls.mostRecent().args[0])
              .toMatch(/Can't bind to 'unknown-prop' since it isn't a known property of 'div'/);
        });

    modifiedInIvy('Unknown properties throw an error instead of logging a warning')
        .it('should throw on unknown props if NO_ERRORS_SCHEMA is absent', () => {
          @Component({
            selector: 'my-comp',
            template: `
              <ng-container *ngIf="condition">
                <div [unknown-prop]="true"></div>
              </ng-container>
            `,
          })
          class MyComp {
            condition = true;
          }

          @NgModule({
            imports: [CommonModule],
            declarations: [MyComp],
          })
          class MyModule {
          }

          TestBed.configureTestingModule({imports: [MyModule]});

          expect(() => {
            const fixture = TestBed.createComponent(MyComp);
            fixture.detectChanges();
          }).toThrowError(/Can't bind to 'unknown-prop' since it isn't a known property of 'div'/);
        });

    it('should not throw on unknown props if NO_ERRORS_SCHEMA is present', () => {
      @Component({
        selector: 'my-comp',
        template: `
          <ng-container *ngIf="condition">
            <div [unknown-prop]="true"></div>
          </ng-container>
        `,
      })
      class MyComp {
        condition = true;
      }

      @NgModule({
        imports: [CommonModule],
        schemas: [NO_ERRORS_SCHEMA],
        declarations: [MyComp],
      })
      class MyModule {
      }

      TestBed.configureTestingModule({imports: [MyModule]});

      expect(() => {
        const fixture = TestBed.createComponent(MyComp);
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should throw unknown element error without CUSTOM_ELEMENTS_SCHEMA for element with dash in tag name',
       () => {
         @Component({template: `<custom-el></custom-el>`})
         class MyComp {
         }

         TestBed.configureTestingModule({declarations: [MyComp]});

         expect(() => {
           const fixture = TestBed.createComponent(MyComp);
           fixture.detectChanges();
         }).toThrowError(/'custom-el' is not a known element/);
       });

    it('should throw unknown element error without CUSTOM_ELEMENTS_SCHEMA for element without dash in tag name',
       () => {
         @Component({template: `<custom></custom>`})
         class MyComp {
         }

         TestBed.configureTestingModule({declarations: [MyComp]});

         expect(() => {
           const fixture = TestBed.createComponent(MyComp);
           fixture.detectChanges();
         }).toThrowError(/'custom' is not a known element/);
       });

    it('should not throw unknown element error with CUSTOM_ELEMENTS_SCHEMA', () => {
      @Component({template: `<custom-el></custom-el>`})
      class MyComp {
      }

      TestBed.configureTestingModule({
        declarations: [MyComp],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      });

      expect(() => {
        const fixture = TestBed.createComponent(MyComp);
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not throw unknown element error with NO_ERRORS_SCHEMA', () => {
      @Component({template: `<custom-el></custom-el>`})
      class MyComp {
      }

      TestBed.configureTestingModule({
        declarations: [MyComp],
        schemas: [NO_ERRORS_SCHEMA],
      });

      expect(() => {
        const fixture = TestBed.createComponent(MyComp);
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should not throw unknown element error if element matches a directive', () => {
      @Component({
        selector: 'custom-el',
        template: '',
      })
      class CustomEl {
      }

      @Component({template: `<custom-el></custom-el>`})
      class MyComp {
      }

      TestBed.configureTestingModule({declarations: [MyComp, CustomEl]});

      expect(() => {
        const fixture = TestBed.createComponent(MyComp);
        fixture.detectChanges();
      }).not.toThrow();
    });

  });
});
