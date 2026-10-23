// The few parts of Microsoft Edge WebView2's COM interfaces that Player/main.c uses: the
// slot of each method in its interface's vtable, and the interface IDs. Generated from
// WebView2.h of the WebView2 SDK (NuGet Microsoft.Web.WebView2 1.0.3485.44), so the SDK
// itself is not needed to build the player. Every slot below is in the base interface or
// an older version of it, so later runtimes keep them where they are.
//
// The SDK's license, whose notice this derived file keeps:
//
// Copyright (C) Microsoft Corporation. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//    * Redistributions of source code must retain the above copyright notice, this list of
//      conditions and the following disclaimer.
//    * Redistributions in binary form must reproduce the above copyright notice, this list
//      of conditions and the following disclaimer in the documentation and/or other
//      materials provided with the distribution.
//    * The name of Microsoft Corporation, or the names of its contributors may not be used
//      to endorse or promote products derived from this software without specific prior
//      written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
// OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT
// LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
#pragma once
#include <windows.h>

// ICoreWebView2Environment
#define ENV_CreateCoreWebView2Controller 3

// ICoreWebView2Controller2
#define CTL_put_IsVisible 4
#define CTL_put_Bounds 6
#define CTL_MoveFocus 12
#define CTL_add_AcceleratorKeyPressed 19
#define CTL_NotifyParentWindowPositionChanged 23
#define CTL_Close 24
#define CTL_get_CoreWebView2 25
#define CTL_put_DefaultBackgroundColor 27

// ICoreWebView2_3
#define WV_get_Settings 3
#define WV_Navigate 5
#define WV_NavigateToString 6
#define WV_add_NavigationStarting 7
#define WV_add_NavigationCompleted 15
#define WV_ExecuteScript 29
#define WV_Reload 31
#define WV_add_NewWindowRequested 44
#define WV_OpenDevToolsWindow 51
#define WV_add_ContainsFullScreenElementChanged 52
#define WV_get_ContainsFullScreenElement 54
#define WV_SetVirtualHostNameToFolderMapping 71

// ICoreWebView2Settings8
#define SET_put_IsStatusBarEnabled 10
#define SET_put_AreDevToolsEnabled 12
#define SET_put_AreDefaultContextMenusEnabled 14
#define SET_put_IsZoomControlEnabled 18
#define SET_put_IsBuiltInErrorPageEnabled 20
#define SET_put_AreBrowserAcceleratorKeysEnabled 24
#define SET_put_IsPasswordAutosaveEnabled 26
#define SET_put_IsGeneralAutofillEnabled 28
#define SET_put_IsPinchZoomEnabled 30
#define SET_put_IsSwipeNavigationEnabled 32
#define SET_put_IsReputationCheckingRequired 36

// ICoreWebView2NavigationStartingEventArgs
#define NAVARGS_get_Uri 3
#define NAVARGS_put_Cancel 8

// ICoreWebView2NewWindowRequestedEventArgs
#define WINARGS_get_Uri 3
#define WINARGS_put_Handled 6

// ICoreWebView2AcceleratorKeyPressedEventArgs
#define KEYARGS_get_KeyEventKind 3
#define KEYARGS_get_VirtualKey 4
#define KEYARGS_put_Handled 8

static const IID IID_ICoreWebView2Controller2 = {0xc979903e,0xd4ca,0x4228,{0x92,0xeb,0x47,0xee,0x3f,0xa9,0x6e,0xab}};
static const IID IID_ICoreWebView2_3 = {0xA0D6DF20,0x3B92,0x416D,{0xAA,0x0C,0x43,0x7A,0x9C,0x72,0x78,0x57}};
static const IID IID_ICoreWebView2Settings3 = {0xfdb5ab74,0xaf33,0x4854,{0x84,0xf0,0x0a,0x63,0x1d,0xeb,0x5e,0xba}};
static const IID IID_ICoreWebView2Settings8 = {0x9e6b0e8f,0x86ad,0x4e81,{0x81,0x47,0xa9,0xb5,0xed,0xb6,0x86,0x50}};
static const IID IID_ICoreWebView2EnvironmentOptions = {0x2fde08a8,0x1e9a,0x4766,{0x8c,0x05,0x95,0xa9,0xce,0xb9,0xd1,0xc5}};
static const IID IID_ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler = {0x4e8a3389,0xc9d8,0x4bd2,{0xb6,0xb5,0x12,0x4f,0xee,0x6c,0xc1,0x4d}};
static const IID IID_ICoreWebView2CreateCoreWebView2ControllerCompletedHandler = {0x6c4819f3,0xc9b7,0x4260,{0x81,0x27,0xc9,0xf5,0xbd,0xe7,0xf6,0x8c}};
static const IID IID_ICoreWebView2NavigationStartingEventHandler = {0x9adbe429,0xf36d,0x432b,{0x9d,0xdc,0xf8,0x88,0x1f,0xbd,0x76,0xe3}};
static const IID IID_ICoreWebView2NewWindowRequestedEventHandler = {0xd4c185fe,0xc81c,0x4989,{0x97,0xaf,0x2d,0x3f,0xa7,0xab,0x56,0x51}};
static const IID IID_ICoreWebView2AcceleratorKeyPressedEventHandler = {0xb29c7e28,0xfa79,0x41a8,{0x8e,0x44,0x65,0x81,0x1c,0x76,0xdc,0xb2}};
static const IID IID_ICoreWebView2NavigationCompletedEventHandler = {0xd33a35bf,0x1c49,0x4f98,{0x93,0xab,0x00,0x6e,0x05,0x33,0xfe,0x1c}};
static const IID IID_ICoreWebView2ExecuteScriptCompletedHandler = {0x49511172,0xcc67,0x4bca,{0x99,0x23,0x13,0x71,0x12,0xf4,0xc4,0xcc}};
static const IID IID_ICoreWebView2ContainsFullScreenElementChangedEventHandler = {0xe45d98b1,0xafef,0x45be,{0x8b,0xaf,0x6c,0x77,0x28,0x86,0x7f,0x73}};

// COREWEBVIEW2_KEY_EVENT_KIND
#define KEY_EVENT_KIND_KEY_DOWN 0
#define KEY_EVENT_KIND_SYSTEM_KEY_DOWN 2
// COREWEBVIEW2_HOST_RESOURCE_ACCESS_KIND
#define HOST_RESOURCE_ACCESS_KIND_ALLOW 1
// COREWEBVIEW2_MOVE_FOCUS_REASON
#define MOVE_FOCUS_REASON_PROGRAMMATIC 0

typedef struct { BYTE A, R, G, B; } COREWEBVIEW2_COLOR;
typedef struct { __int64 value; } WV2_TOKEN; // EventRegistrationToken
