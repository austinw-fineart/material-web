/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {animate, fadeIn, fadeOut} from '@lit-labs/motion';
import {EASING} from '@material/web/internal/motion/animation.js';
import {css, html, LitElement, nothing} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import {drawerOpenSignal} from '../signals/drawer-open-state.js';
import {inertContentSignal, inertSidebarSignal} from '../signals/inert.js';
import {SignalElement} from '../signals/signal-element.js';

/**
 * A layout element that positions the top-app-bar, the main page content, and
 * the side navigation drawer.
 *
 * The drawer will automatically set itself as collapsible at narrower page
 * widths, and position itself inline with the page at wider page widths. Most
 * importantly, this sidebar is SSR compatible.
 */
@customElement('nav-drawer') export class NavDrawer extends SignalElement
(LitElement) {
  /**
   * Whether or not the side drawer is collapsible or inline.
   */
  @state() private isCollapsible = false;

  render() {
    const showModal = this.isCollapsible && drawerOpenSignal.value;

    // Values taken from internal material motion spec
    const drawerSlideAnimationDuration = showModal ? 500 : 150;
    const drawerContentOpacityDuration = showModal ? 300 : 150;
    const scrimOpacityDuration = 150;

    const drawerSlideAnimationEasing =
        showModal ? EASING.EMPHASIZED : EASING.EMPHASIZED_ACCELERATE;

    return html`
      <div class="root" data-animation-speed=${showModal ? 'long' : 'short'}>
        <slot name="top-app-bar"></slot>
        <div class="body  ${drawerOpenSignal.value ? 'open' : ''}">
          <div class="spacer" ?inert=${inertSidebarSignal.value}>
            ${showModal
              ? html`<div
                  class="scrim"
                  @click=${this.onScrimClick}
                  ${animate({
                    properties: ['opacity'],
                    keyframeOptions: {
                      duration: scrimOpacityDuration,
                      easing: 'linear',
                    },
                    in: fadeIn,
                    out: fadeOut,
                  })}
                ></div>`
              : nothing}
            <aside
              ?inert=${this.isCollapsible && !drawerOpenSignal.value}
              ${animate({
                properties: ['transform'],
                keyframeOptions: {
                  duration: drawerSlideAnimationDuration,
                  easing: drawerSlideAnimationEasing,
                },
              })}
            >
              <slot
                ${animate({
                  properties: ['opacity'],
                  keyframeOptions: {
                    duration: drawerContentOpacityDuration,
                    easing: 'linear',
                  },
                })}
              ></slot>
            </aside>
          </div>
          <div class="pane">
            <div
              class="content"
              ?inert=${showModal || inertContentSignal.value}
            >
              <slot name="app-content"></slot>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Closes the drawer on scrim click.
   */
  private onScrimClick() {
    drawerOpenSignal.value = false;
  }

  firstUpdated() {
    const queryResult = window.matchMedia('(max-width: 1500px)');
    this.isCollapsible = queryResult.matches;

    // Listen for page resizes to mark the drawer as collapsible.
    queryResult.addEventListener('change', (e) => {
      this.isCollapsible = e.matches;
    });
  }

  static styles = css`
    :host {
      --_max-width: 1760px;
      --_drawer-width: var(--catalog-drawer-width, 300px);
      /* When in wide mode inline start margin is handled by the sidebar */
      --_pane-margin-inline-start: 0;
      --_pane-margin-inline-end: var(--catalog-spacing-xl);
      --_pane-margin-block-end: var(--catalog-spacing-xl);
      min-height: 100dvh;
      display: flex;
      flex-direction: column;
    }

    ::slotted(*) {
      --md-list-item-list-item-container-shape: var(--catalog-shape-xl);
      --md-focus-ring-shape: var(--catalog-shape-xl);
    }

    .body {
      display: flex;
      flex-grow: 1;
    }

    .spacer {
      position: relative;
      transition: min-width 0.5s cubic-bezier(0.3, 0, 0, 1);
    }

    .spacer,
    aside {
      min-width: var(--_drawer-width);
      max-width: var(--_drawer-width);
    }

    .pane {
      box-sizing: border-box;
      overflow: auto;
      width: 100%;
      /* Explicit height to make overflow work */
      height: calc(
        100dvh - var(--catalog-top-app-bar-height) -
          var(--_pane-margin-block-end)
      );
      background-color: var(--md-sys-color-surface);
      border-radius: var(--catalog-shape-xl);
      padding-block: var(--catalog-spacing-xl);
      margin-inline: var(--_pane-margin-inline-start) var(--_pane-margin-inline-end);
      /* emphasized – duration matching render fn for sidebar */
      transition: 0.5s cubic-bezier(0.3, 0, 0, 1);
      transition-property: margin, height, border-radius;
    }

    [data-animation-speed='short'] .pane {
      /* duration matching render function for sidebar */
      transition-duration: 0.15s;
      /* emphasize-accelerate */
      transition-timing-function: cubic-bezier(0.3, 0, 0.8, 0.15);
    }

    .content {
      flex-grow: 1;
      display: flex;
      justify-content: center;
      box-sizing: border-box;
      padding-inline: var(--catalog-spacing-xl);
      max-width: calc(100vw - var(--_drawer-width));
    }

    .content slot {
      display: block;
      width: 100%;
      max-width: min(100%, var(--_max-width));
    }

    aside {
      transition: transform 0.5s cubic-bezier(0.3, 0, 0, 1);
      position: fixed;
      isolation: isolate;
      inset: var(--catalog-top-app-bar-height) 0 0 0;
      z-index: 12;
      background-color: var(--md-sys-color-surface-container);
    }

    aside slot {
      display: block;
    }

    .scrim {
      background-color: var(--md-dialog-scrim-color, rgba(0, 0, 0, 0.32));
    }

    @media (max-width: 1500px) {
      .spacer {
        min-width: 0px;
      }

      .content {
        max-width: 100vw;
        padding-inline: var(--catalog-spacing-xl);
      }

      .scrim {
        position: fixed;
        inset: 0;
      }

      aside {
        transition: unset;
        transform: translateX(-100%);
        border-radius: 0 var(--catalog-shape-xl) var(--catalog-shape-xl) 0;
      }

      .pane {
        --_pane-margin-inline-start: var(--catalog-spacing-xl);
      }

      .open aside {
        transform: translateX(0);
      }

      aside slot {
        opacity: 0;
      }

      .open aside slot {
        opacity: 1;
      }

      .open .scrim {
        inset: 0;
        z-index: 11;
      }
    }

    @media (max-width: 600px) {
      .pane {
        border-end-start-radius: 0;
        border-end-end-radius: 0;
        --_pane-margin-inline-start: 0;
        --_pane-margin-inline-end: 0;
        --_pane-margin-block-end: 0;
      }
    }

    /* On desktop, make the scrollbars less blocky so you can see the border
     * radius of the pane. On most mobile platforms, these scrollbars are hidden
     * by default. It'll still unfortunately render on top of the border radius.
     */
    @media (pointer: fine) {
      :host {
        --_scrollbar-width: 8px;
      }

      .pane {
        /* firefox */
        scrollbar-color: var(--md-sys-color-primary) transparent;
        scrollbar-width: thin;
      }

      .content {
        /* adjust for the scrollbar width */
        padding-inline-end: calc(
          var(--catalog-spacing-xl) - var(--_scrollbar-width)
        );
      }

      /* Chromium + Safari */
      .pane::-webkit-scrollbar {
        background-color: transparent;
        width: var(--_scrollbar-width);
      }

      .pane::-webkit-scrollbar-thumb {
        background-color: var(--md-sys-color-primary);
        border-radius: calc(var(--_scrollbar-width) / 2);
      }
    }

    @media (forced-colors: active) {
      .pane {
        border: 1px solid CanvasText;
      }

      @media (max-width: 1500px) {
        aside {
          box-sizing: border-box;
          border: 1px solid CanvasText;
        }

        .scrim {
          background-color: var(--md-dialog-scrim-color, rgba(0, 0, 0, 0.75));
        }
      }

      @media (pointer: fine) {
        .pane {
          /* firefox */
          scrollbar-color: CanvasText transparent;
        }

        .pane::-webkit-scrollbar-thumb {
          /* Chromium + Safari */
          background-color: CanvasText;
        }
      }
    }
  `;
}
