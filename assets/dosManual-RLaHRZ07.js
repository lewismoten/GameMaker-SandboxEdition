const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./viewer-Blv6CbW9.js","./watch-Ci1HG5Rl.js","./imposition-Dxm9MY_v.js","./manualPages-BPHgg_c5.js","./gameShots-B5zLkSfH.js","./shared-desk-web-play-dos-DOS3LiN4.js","./levelPicture-BaT01hw_.js","./shared-desk-web-play-BFNwQnCp.js","./draw-VCK-ssjd.js","./paginate-BfbZArNl.js","./kit-DbQ1eFDD.js","./frameShot-DJgT1Y0f.js","./bbsName-C_Z_jafv.js","./bbsName-DsfDb_rj.css","./gameTitle-UN8HXXPF.js","./seededRandom-s0Q9d40o.js","./manualCover-BbbVOU2p.js","./gameVersion-CQgGv7hT.js","./manualCover-DFP2CRwF.css","./paper-fgmJzEzu.css","./redFilm-DJSg44QT.js","./spyglass-Ch7t_Pc7.js","./readView-Bl_eKz0M.js","./scrollPages-BokpCnti.js","./scrollPages-CihdJnYu.css","./save-DxcHL3UH.js","./gmItems-BrwC3SvP.js","./tourButton-DXjuNPQS.js","./tourButton-CEpNth5l.css","./sandboxShots-JlVc8tfO.js","./stickers-CUdpCG-Q.js","./scoopIssue-Bh_E9t1C.js","./scoopIssues-Bd5MubYo.js","./shared-desk-play-dos-BBnKOe_1.js","./diskFacts-CZKZUIqm.js","./keys-Aatu07cM.js","./zip-CAcGIfdl.js","./stickerArt-BLVsZ_K2.js","./yieldNow-BthtaKtD.js","./stickers-BeBLS5mJ.css","./sofaPhone-D6QBwuRl.js","./gmInserts-D_fcowgm.js","./pcExtras-DBbXg75A.js","./registration-D01krLsX.js","./gmInserts-DYa7lUa0.css","./markdownBlocks-BL59OVwi.js","./ultimateItem-CVln9DgK.js","./ultimateItem-C3iZSJBe.css","./replyMail-CQqk3s-6.js","./regConfirm-BXJLkCtI.js","./mailCard-DdCq4SFd.js","./regConfirm-BBPcLyLG.css","./regRecord-Cwqfk_yW.css","./gmItems-DWifTBMe.css","./ownersBook-gGgxBMyu.js","./chapter-ru_26v4Z.js","./media-6TaHC1V3.js","./xml-DVjlua0N.js","./cover-DCmLA7Ec.js"])))=>i.map(i=>d[i]);
import{h as n,_ as f}from"./watch-Ci1HG5Rl.js";/* empty css                */import{U as R,V as L,X as I}from"./shared-desk-web-play-dos-DOS3LiN4.js";import{b as B}from"./imposition-Dxm9MY_v.js";import{s as x}from"./sandboxShots-JlVc8tfO.js";import{T as F,a as N}from"./textScreen-QsEowIwb.js";import{p as b}from"./gm-Z8KseNw8.js";import{s as W}from"./ansiArt-3cPq3xCA.js";import{M as u,a as k,E as g,f as H}from"./computer-25BN32mS.js";import{gmCover as U}from"./gmCover-DlNl9sYO.js";/* empty css                  */import{p as h}from"./pcExtras-DBbXg75A.js";import{checkRegistration as Y,registrationNumber as K}from"./registration-D01krLsX.js";function j(e,o){const t=document.createElement("canvas"),a=new F(t);if(a.cursorVisible=!1,e(a),a.renderNow(),a.destroy(),!o)return t.toDataURL();const r=t.height/25,d=document.createElement("canvas");return d.width=t.width,d.height=(o[1]-o[0]+1)*r,d.getContext("2d").drawImage(t,0,-o[0]*r),d.toDataURL()}const m=(e,o,t,a,r)=>e.write(o,t,a,R(r)),_=e=>{e.print(["Starting DOS...","","DOSKEY installed.","Mouse driver installed","","Type HELP for commands, GM to start Game-Maker, TERMINAL to call the BBS.","","C:\\>CD GM","","C:\\GM>DIR /W",""," Volume in drive C is GAMEMAKER"," Directory of C:\\GM","","[.]             [..]            [HEART]         [NEBULA]        [PEACH]","[PIPEMARE]      [SAMPLE]        [TUTOR]         [ZARK]          GM.EXE","MENU.EXE        PLAYGAME.EXE    GRATOR.EXE      BLOCEDIT.EXE    MAPMAKER.EXE","       15 file(s)      1,612,288 bytes","                      21,430,272 bytes free","","C:\\GM>GM"].join(`
`))},V=e=>b(e,"main",1),$=e=>b(e,"design",8),q=e=>b(e,"utilities",3),z=e=>{b(e,"design",2);const o="Choose a Block Set: ",t=4,a=4,r=o.length+2+30+1;e.window(t,a,r,1,u,k),m(e,t+1,a,u,`${o}SAMPLE.BBL`);const d=t+o.length+2,i=["..","SAMPLE.BBL","SAMPLE.CBL","SAMPLE.MBL","<New file>"];e.window(d-1,a+2,15,i.length,u,k),i.forEach((l,A)=>{m(e,d,a+2+A,A===1?H:u,` ${l}`.padEnd(15))})},X=e=>{b(e,"design",8);const o="Can't find SAMPLE.GAM!",t="(C)ontinue",a=o.length,r=40-Math.floor(a/2)-1;e.box(r-1,7,r+a+3,10,g,2,k),e.fill(r,8,r+a+2,9,g),m(e,r+1,8,g,o),m(e,r+1,9,g,t)},Z=e=>{e.cursorY=W(e),m(e,0,e.cursorY,N(14,0),"Enter your handle, or GUEST: ")},M="Game-Maker 3.0 Owner’s Guide";function T(e,...o){const t=document.createElement("div");return t.innerHTML=e,t.append(...o),t}function c(e,o,t){return`<figure><img alt="${o}" src="${j(e,t)}"><figcaption>${o}</figcaption></figure>`}const s=(e,o,...t)=>({head:[M,e],body:T(o,...t)}),Q={maximus:"Maximus: The Hundred Worlds. A hundred small maps linked by doors.",teddy:"Teddy’s Little Big Adventure. A two-block hero with twenty animations.",year2000:"In The Year 2000! Blocks that move the character along like conveyors.",snowbound:"Snowbound: The $89 Shovel. Monsters on paths drive the traffic.",sandcast:"Sandcastle Knight. Gravity blocks, and objects to pick up and put down.",blaster:"Virus Blaster. Shots, explosions and monsters born from other monsters.",logic:"Ohm Sweet Ohm. Blocks that change when touched make the puzzles.",sleuth:"Final Curtain. Text screens between the levels tell the story."};function y(e,o){return`<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 3cqw">${e.map((t,a)=>`<figure><img alt="${t.title}" src="${t.canvas.toDataURL()}"><figcaption>Figure 3-${o+a}. ${Q[t.id]??t.title}</figcaption></figure>`).join("")}</div>`}function v(e){const o=e.find(t=>t.id==="teddy")??e[0];return U(o?.canvas.toDataURL(),o?.title)}const ye=Object.freeze(Object.defineProperty({__proto__:null,TITLE:M,coverOf:v,div:T,figure:c,gallery:y,page:s},Symbol.toStringTag,{value:"Module"}));function C(e,o){const t=Y(e,o);return t.kind==="registered"?{name:t.userName,number:String(K(t.userName,o))}:void 0}const w=new Set;let E=!1;function S(e,o){const t=String(h().serial);for(const a of e.querySelectorAll(".rr-printed[data-serial]"))a.textContent!==t&&(a.textContent=t);for(const a of e.querySelectorAll(".rr-hand[data-reg]")){const r=o?.[a.dataset.reg]??"",d=a.nextElementSibling;a.textContent!==r&&(a.textContent=r),d instanceof HTMLElement&&(d.hidden=!!r)}}function J(){const e=C(h().reg,h().serial);S(document,e);for(const o of w){const t=o.deref();t?S(t,e):w.delete(o)}}function p(e,o){const t=o?n("span",{class:"rr-line"},n("span",{class:`rr-hand rr-${o}`,"data-reg":o}),n("span",{class:"rr-blank"},"not filled in")):n("span",{class:"rr-line rr-printed","data-serial":""});return n("div",{class:"rr-row"},n("dt",null,e),n("dd",null,t))}function D(e){const o=e==="page"?n("div",{class:"rr rr-page"},n("div",{class:"rr-head"},"This copy is registered to"),n("dl",null,p("Name","name"),p("Serial number",void 0),p("Registration number","number")),n("div",{class:"rr-small"},"Write them in when the reply card comes back: GM REGISTER asks for both.")):n("div",{class:"rr rr-cover"},n("dl",null,p("Registered to","name"),p("Registration number","number")));return S(o,C(h().reg,h().serial)),w.add(new WeakRef(o)),E||(E=!0,h().listen(J)),o}function ee(e){return[{cover:!0,body:v(e)},s("Contents",`<h1>Contents</h1>
      <table>
        <tr><td>1. Getting Started</td><td>2</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Drives and DOS commands</td><td>3</td></tr>
        <tr><td>2. The Main Menu</td><td>5</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Playing, saving and high scores</td><td>6</td></tr>
        <tr><td>3. Designing Games</td><td>8</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Game-Maker words</td><td>9</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;How a game comes together</td><td>11</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;The tools at a glance</td><td>13</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Games made with Game-Maker</td><td>16</td></tr>
        <tr><td>4. Utilities</td><td>18</td></tr>
        <tr><td>&nbsp;&nbsp;&nbsp;Troubleshooting a real PC</td><td>20</td></tr>
        <tr><td>5. The Game-Maker BBS</td><td>21</td></tr>
        <tr><td>6. Sharing Your Games</td><td>22</td></tr>
        <tr><td>Appendix A. Specifications</td><td>24</td></tr>
        <tr><td>Appendix B. Files and Folders</td><td>26</td></tr>
        <tr><td>Appendix C. The Copy Check</td><td>27</td></tr>
        <tr><td>Appendix D. About This Edition</td><td>28</td></tr>
      </table>
      <div class="note"><strong>Welcome!</strong> It’s as much fun to create computer games as it is to play them.
      Game-Maker lets you turn your game ideas into great games with no programming at all.
      We suggest you start by playing a few of the sample games, then read Chapter 3 and try
      the tools in the order given there.</div>`,D("page")),s("1. Getting Started",`<span class="chapter">1</span>
      <h1>Getting Started</h1>
      <p>Your desk has everything you need: the PC, a box of 3½″ diskettes, the Game-Maker
      box with its CD-ROM, and the shareware catalog.</p>
      <h2>Turning on the computer</h2>
      <p>Press <b>POWER</b> on the front of the computer. The BIOS counts memory, DOS starts,
      and you are left at the <code>C:\\&gt;</code> prompt. Click the screen (or the keyboard)
      before typing.</p>
      <p>The <b>TURBO</b> button switches between full speed and the speed of an older PC,
      about a 286. Programs load and unpack more slowly with Turbo off. Game-Maker games play
      at nearly the same pace; with Turbo off a busy scrolling screen can stutter a little and
      the view trails the player, as on a 286.</p>
      <p>The <b>⤢</b> button on the monitor fills your window with the screen. Press it
      again to return to the desk.</p>`),s("1. Getting Started",`<h2>Your computer and its drives</h2>
      <table>
        <tr><th>Drive</th><th>What it holds</th></tr>
        <tr><td><b>A:</b></td><td>The 3½″ 1.44 MB floppy drive. Pick a diskette from the disk box to put it in; press <b>EJECT</b> to take it out.</td></tr>
        <tr><td><b>C:</b></td><td>The hard disk. Game-Maker is installed in <code>C:\\GM</code>, with one folder for each game. Shareware you download from the BBS goes in <code>C:\\DOWNLOAD</code>.</td></tr>
        <tr><td><b>D:</b></td><td>The Game-Maker CD-ROM, exactly as it shipped. You can play from it, but you can’t change it.</td></tr>
      </table>
      <p>You do not need a diskette to use Game-Maker. Everything can be done on the hard disk.
      Diskettes are for games other people gave you, and for the games you <i>Transfer</i> to
      give away.</p>
      ${c(_,"Figure 1-1. The DOS prompt after starting up.")}`),s("1. Getting Started",`<h2>DOS commands you will need</h2>
      <p>Type a command and press <kbd>Enter</kbd>. Upper and lower case are the same.
      Type <code>HELP</code> at any time for a summary.</p>
      <table>
        <tr><th>Command</th><th>What it does</th></tr>
        <tr><td><code>DIR</code> [<code>/W</code>] [<code>/P</code>]</td><td>Lists the files in this folder. <code>/W</code> lists them across the screen, <code>/P</code> stops after each screenful.</td></tr>
        <tr><td><code>CD GM</code></td><td>Goes into the GM folder. <code>CD ..</code> goes back out, <code>CD \\</code> goes to the top.</td></tr>
        <tr><td><code>A:</code> <code>C:</code> <code>D:</code></td><td>Changes to another drive.</td></tr>
        <tr><td><code>MD C:\\GM\\MYGAME</code></td><td>Makes a new folder for a game of your own.</td></tr>
        <tr><td><code>TYPE README.TXT</code></td><td>Shows a text file. Shareware games tell you how to register in their text files.</td></tr>
        <tr><td><code>GM</code></td><td>Starts Game-Maker.</td></tr>
        <tr><td><code>PLAYGAME</code></td><td>Plays a game without the menus.</td></tr>
        <tr><td><code>TERMINAL</code></td><td>Calls the Game-Maker BBS with your modem.</td></tr>
        <tr><td><code>CLS</code> <code>VER</code> <code>MEM</code></td><td>Clears the screen, shows the DOS version, shows memory.</td></tr>
      </table>
      <p>To run a game on a diskette, put it in drive A:, type <code>A:</code> and then the
      game’s name. <code>DIR</code> shows the <code>.EXE</code> to type.</p>
      <div class="note"><strong>Tip.</strong> Pressing <kbd>↑</kbd> brings back the last command (DOSKEY).</div>`),s("2. The Main Menu",`<span class="chapter">2</span>
      <h1>The Main Menu</h1>
      <p>Type <code>GM</code> at the prompt, or click the Game-Maker box on the desk. The main
      menu appears across the top of the screen.</p>
      ${c(V,"Figure 2-1. The main menu.",[0,2])}
      <p>Use <kbd>←</kbd> and <kbd>→</kbd> to move the bar, then press <kbd>Enter</kbd>.
      You can also press the first letter of an item, or click it with the mouse.
      <kbd>Esc</kbd> backs out of any menu.</p>
      <table>
        <tr><td><b>Play</b></td><td>Choose a game and play it.</td></tr>
        <tr><td><b>Design</b></td><td>The design tools (Chapter 3).</td></tr>
        <tr><td><b>Utilities</b></td><td>Backup, Restore, Transfer, Joystick Setup and Joystick Diagnostic (Chapter 4).</td></tr>
        <tr><td><b>About</b></td><td>About Game-Maker and how to order it.</td></tr>
        <tr><td><b>Quit</b></td><td>Return to DOS.</td></tr>
        <tr><td><b>Help</b></td><td>A help screen for this menu. Every menu has one.</td></tr>
      </table>
      <p>The bottom line of the screen shows the <i>game area</i>: the folder Game-Maker is working in.</p>`),s("2. The Main Menu",`<h2>Playing games</h2>
      <p>Choose <b>Play</b>, then pick a game’s <code>.GAM</code> file. The sample games
      <i>Sample</i>, <i>Pipemare</i> and <i>Nebula</i> are good ones to start with.</p>
      <p>The arrow keys move your character four ways; in games whose hero moves diagonally, the
      corner keys of the numeric keypad (<kbd>Home</kbd>, <kbd>PgUp</kbd>, <kbd>End</kbd>,
      <kbd>PgDn</kbd>) move it the other four. Other actions (jumping, shooting, and so on) use
      the keys the game’s designer chose; press <kbd>F1</kbd> to see the game’s own help.</p>
      <table>
        <tr><th>Key</th><th>During a game</th></tr>
        <tr><td><kbd>Esc</kbd></td><td>Stop the game and go back to its title menu; also leaves the F1, F2 and F10 screens</td></tr>
        <tr><td><kbd>F1</kbd></td><td>Help</td></tr>
        <tr><td><kbd>F2</kbd></td><td>Status and inventory (press it again to go back to the game)</td></tr>
        <tr><td><kbd>F3</kbd></td><td>Music on or off</td></tr>
        <tr><td><kbd>F4</kbd></td><td>Sound on or off</td></tr>
        <tr><td><kbd>F5</kbd></td><td>Save the game</td></tr>
        <tr><td><kbd>F6</kbd></td><td>Restore a saved game</td></tr>
        <tr><td><kbd>F7</kbd></td><td>Not used (kept for a later version)</td></tr>
        <tr><td><kbd>F8</kbd></td><td>Joystick on or off</td></tr>
        <tr><td><kbd>F9</kbd></td><td>Calibrate the joystick</td></tr>
        <tr><td><kbd>F10</kbd></td><td>About Game-Maker</td></tr>
      </table>
      <div class="note"><strong>Note.</strong> A joystick or game pad plugged into your computer works
      in every game. Press <kbd>F8</kbd> to switch to it.</div>`),s("2. The Main Menu",`<h2>A game’s title menu</h2>
      <p>Every game starts at its own title screen with the same menu: <b>Play</b>, <b>Read
      Instructions</b>, <b>Read Storyline</b>, <b>See Credits</b>, <b>See Highest Scores</b> and
      <b>Quit</b>. Move the bar with the arrow keys and press <kbd>Enter</kbd>.</p>
      <h3>Saving your place</h3>
      <p><kbd>F5</kbd> saves the game in one of ten slots; type a name for it so you know it
      again. <kbd>F6</kbd> lists the slots and picks up where you left off.</p>
      <h3>Lives and levels</h3>
      <p>When your hero dies, a life is used up and the level starts over. Your score, money,
      counters and inventory go with you from level to level; hit points are filled up again
      after each death. When the last life is gone the game is over.</p>
      <h3>High scores and demos</h3>
      <p>Each game keeps its own top ten. A game that makes the list is recorded as it was
      played, in <code>DATA1.REC</code> through <code>DATA10.REC</code>. If nobody touches the
      title menu for 30 seconds, the game plays its demo: a recording its designer made with the
      Integrator.</p>
      <h3>Small sample games</h3>
      <p>The Sample CD holds short games, one idea each, in the <code>SAMPLES</code> folder (D:\\SAMPLES): dozens of them, and <code>DIR SAMPLES /W</code> lists them all on one screen. The first three are also on the Sample Disk, a diskette. Start with these six:</p>
      <table>
        <tr><td><b>First Steps</b></td><td><code>FIRSTSTP</code></td><td>Walking, jumping, the exit.</td></tr>
        <tr><td><b>Keys and Doors</b></td><td><code>KEYSDOOR</code></td><td>A key and the door it fits.</td></tr>
        <tr><td><b>Meet the Monsters</b></td><td><code>MONSTERS</code></td><td>Foes that patrol, chase, shoot.</td></tr>
        <tr><td><b>Room to Room</b></td><td><code>ROOMS</code></td><td>Doors and stairs between maps.</td></tr>
        <tr><td><b>Coins and Score</b></td><td><code>COINS</code></td><td>Treasure, points and counters.</td></tr>
        <tr><td><b>Watch Your Step</b></td><td><code>HAZARDS</code></td><td>Hazards, hit points and lives.</td></tr>
      </table>
      <p>Load one by its folder (<code>SAMPLES\\FIRSTSTP</code>, say); <b>Design</b> shows how it is made.</p>`)]}function te(e){return[s("3. Designing Games",`<span class="chapter">3</span>
      <h1>Designing Games</h1>
      <p>Choose <b>Design</b> from the main menu to see the design tools. Each one is its own
      program with full color graphical screens; a mouse is needed.</p>
      ${c($,"Figure 3-1. The Design menu with the Integrator chosen.",[0,2])}
      <table>
        <tr><td><b>Palette</b></td><td>Sets of 256 colors to paint with.</td></tr>
        <tr><td><b>Block</b></td><td>Draw 20×20 picture blocks for backgrounds, monsters and characters.</td></tr>
        <tr><td><b>Monster</b></td><td>Animate monster blocks and give them powers and paths.</td></tr>
        <tr><td><b>Map</b></td><td>Build scenes up to 100×100 blocks, and place monsters.</td></tr>
        <tr><td><b>Character</b></td><td>Animate your hero and set the keys that control it.</td></tr>
        <tr><td><b>Image</b></td><td>Cut blocks out of GIF pictures.</td></tr>
        <tr><td><b>Sound</b></td><td>Design sound effects.</td></tr>
        <tr><td><b>Integrator</b></td><td>Put scenes, characters, music and pictures together into a game.</td></tr>
      </table>`),s("3. Designing Games",`<h2>Game-Maker words</h2>
      <table>
        <tr><td><b>Block</b></td><td>A small square picture, 20 by 20 dots (pixels). Scenery, monsters and heroes are all drawn as blocks.</td></tr>
        <tr><td><b>Map</b></td><td>One scene of a game: a grid of background blocks up to 100 by 100, with monsters placed on it.</td></tr>
        <tr><td><b>Character</b></td><td>The hero the player controls.</td></tr>
        <tr><td><b>Monster</b></td><td>Anything else that moves: enemies, friends, shots, doors that open, birds overhead.</td></tr>
        <tr><td><b>Gameware</b></td><td>The pieces a game is made of (palettes, block sets, monsters, characters, maps, sounds). You can borrow gameware from one game for another.</td></tr>
        <tr><td><b>Game area</b></td><td>The folder that holds one game’s files, such as <code>C:\\GM\\SAMPLE</code>.</td></tr>
        <tr><td><b>MB1 / MB2</b></td><td>The left and right mouse buttons. MB2 often does a second job, such as picking a color for the right button.</td></tr>
      </table>
      <h3>From dot to world</h3>
      <p>A VGA screen is 320 dots across and 200 down, in 256 colors. Sixteen blocks fit across
      it and ten down, so a full 100 by 100 map is about 62 screens. The map scrolls as the hero
      moves, and its right edge joins its left (and its top its bottom), so a hero can walk all
      the way around a world.</p>`),s("3. Designing Games",`<h2>Choosing files</h2>
      <p>Every tool starts by asking which file to work on. Type a name, or move through the
      list with the arrow keys and press <kbd>Enter</kbd>. Choose <code>..</code> to go up a
      folder, or a folder’s name to go into it. Choose <code>&lt;New file&gt;</code> to start
      a new one.</p>
      ${c(z,"Figure 3-2. Choosing a block set in C:\\GM\\SAMPLE.",[0,12])}
      <h3>Changing the games that came with Game-Maker</h3>
      <p>The sample games in <code>C:\\GM</code> are yours to change. If you change your mind,
      <b>Utilities, Restore</b> puts a game back the way it came on the CD.</p>
      <h3>Today’s tools</h3>
      <p>Each designer has a <b>MENU</b> button (or <kbd>Esc</kbd>) that returns to its menu, and
      a <b>HELP!</b> button. To work on the same files with the modern Game-Maker for the web,
      use the yellow note on the monitor. See its own guide (the <b>?</b> link) for details.</p>`),s("3. Designing Games",`<h2>How a game comes together</h2>
      <p>Most designers work in this order. Keep every file for one game in the same folder.</p>
      <ol>
        <li>Make a folder: at the DOS prompt type <code>MD C:\\GM\\MYGAME</code>, or choose
        <code>&lt;New file&gt;</code> in any tool and give the game a name.</li>
        <li><b>Palette.</b> Start from a palette of a sample game, or make your own.</li>
        <li><b>Block.</b> Draw background blocks (<code>.BBL</code>), monster blocks
        (<code>.MBL</code>) and character blocks (<code>.CBL</code>). Set which background
        blocks are solid, which have gravity, and which can be picked up.</li>
        <li><b>Monster</b> and <b>Character.</b> Arrange blocks into animation sequences.</li>
        <li><b>Map.</b> Paint a scene with your background blocks and place monsters on it.</li>
        <li><b>Sound.</b> Optional sound effects for the character and blocks.</li>
        <li><b>Integrator.</b> Make the <code>.GAM</code> file: list the scenes, link the doors
        between them, and add title pictures, FLI animations and music.</li>
        <li><b>Play</b> it from the main menu.</li>
      </ol>
      <div class="note"><strong>Tip.</strong> The fastest way to learn is to change a game that
      already works. Try the exercise on the next page before you build all of these parts.</div>`),s("3. Designing Games",`<h2>Your first change</h2>
      <p>Take the brick path away from the cottage in <i>Sample</i>, then play it to see the change.</p>
      <ol>
        <li><b>Back it up.</b> At the prompt type <code>CD \\GM\\SAMPLE</code>, then <code>GM</code>.
        The bottom line reads <i>Game area: C:\\GM\\SAMPLE</i>. Choose <b>Utilities</b>, then
        <b>Backup</b>, and press <kbd>Enter</kbd> on <code>SAMPLE.GAM</code>. Every file in the
        folder goes into <code>SAMPLE.ZIP</code> under its own name (page 18). Press <kbd>C</kbd>,
        then <kbd>Esc</kbd>.</li>
        <li><b>Open its map.</b> Choose <b>Design</b>, then <b>Map</b>. Press <kbd>Enter</kbd> at
        <b>Choose a Map</b> and again on <code>SAMPLE.MAP</code>. The bar moves down by itself:
        press <kbd>Enter</kbd> twice at each of the next four items to load the block sets,
        monsters and palette, then once at <b>Edit Chosen Map</b>.</li>
        <li><b>Change the scenery.</b> Press <kbd>Z</kbd> to see the top left corner full size: the
        cottage, with a brick path from its front door. Grass, the first block in the list, and
        the dot tool are already chosen. Hold MB1 and drag along the path.</li>
        <li><b>Save, then play.</b> Press <kbd>Esc</kbd>. At <b>Save Map</b> press <kbd>Enter</kbd>,
        <kbd>Enter</kbd> on <code>SAMPLE.MAP</code>, and <kbd>Y</kbd> to write over it. Press
        <kbd>Enter</kbd> at <b>Quit</b> and <kbd>Esc</kbd>. Choose <b>Play</b>, <b>Play a
        Game!</b> and <code>SAMPLE.GAM</code>, then <b>Play</b>.</li>
        <li><b>Look.</b> The hero starts in the cottage doorway, and grass now runs up to the door.</li>
      </ol>
      <div class="note"><strong>Changed your mind?</strong> <b>Utilities, Restore</b> puts Sample
      back the way it came on the CD.</div>`),s("3. Designing Games",`<h2>The tools at a glance</h2>
      <h3>Palette Designer</h3>
      <p>A palette is 256 colors, each mixed from red, green and blue (0 to 63 each). Keep color 0
      black: it is the background of every design screen. Color 15 is the mouse pointer, and
      color 255 is “clear”: monsters and characters show the scenery through it.</p>
      <p class="see"><i>On the Sample CD</i> (<code>D:\\SAMPLES\\DAYNIGHT</code>), the palette changes in steps for a sunset; in <code>SAMEHOUS</code>, one house is three houses, each door naming its own palette; in <code>COLORS</code>, a plate that stings and a plate that is safe are told apart by shape and brightness, so they read in any color; in <code>COLRDOOR</code>, one room is seen through five doors, each scene giving it its own palette.</p>
      <h3>Block Designer</h3>
      <p>A background set holds 150 blocks, a monster set 100 and a character set 50. Draw with
      the dot, line, box, filled box, circle, disk and fill tools; shift, rotate and flip a block
      with the buttons below it. Block 0 is what a new map is filled with.</p>
      <p>The <b>INFO</b> screen gives a background block its <i>attributes</i>: which sides are
      solid, which way gravity pulls (two directions make a diagonal, opposite ones a glide
      area), whether it is an object to pick up, what it becomes after a time or when touched,
      what it adds to score, hit points, money, lives or a counter, and which monster it gives
      birth to. Drag one block onto another to copy its attributes.</p>
      <p class="see"><i>On the Sample CD:</i> <code>SLIPPERY</code> (ice and springs), <code>SMASHIT</code> and <code>DIGIT</code> (blocks that break or dig), <code>SWITCHES</code>, <code>THREETOK</code>, <code>ANDGATE</code>, <code>SHOWCNT</code> and <code>LOOKWALL</code> (counters and secret walls), <code>ROLLDICE</code> (a die that stops on a touch), <code>WORDLOCK</code> (a lock that takes words and a tray that gives them back) <code>POWERKEY</code> (keys of different worth, and doors with a price), <code>SPENDIT</code> (a stall that sells a key for coins), <code>KITSSHOP</code> (a shop with three things for sale, each bought once) and <code>SPECCNTR</code> (a key that only fits the door on its own counter).</p>
      <div class="note"><strong>Time.</strong> Game time runs at about 18 ticks a second: 1092 ticks
      is a minute, and the longest wait, 9999 ticks, is about nine minutes.</div>
      <p class="see"><i>On the Sample CD:</i> <code>CLOCK</code>, <code>COUNTDWN</code>, <code>WARNFRST</code> and <code>BLOCKBRN</code> (gates that take turns) use time.</p>
      <p class="see"><i>A hit, a lamp and a storm sky that stay easy on the eyes are on the Sample CD:</i> <code>FLASHSAF</code>.</p>
      <p class="see"><i>A storm made of blocks, a sky and a bolt that swap to lit twins on one clock and thunder written into the song, are on the Sample CD:</i> <code>LIGHTNIN</code>.</p>
      <p class="see"><i>What slows a game on an old PC (a long sound, a crowd of monsters, a sky that moves) is on the Sample CD:</i> <code>SLOWPC</code>.</p>
      <p class="see"><i>Stars that twinkle out of step, by loops with different times, are on the Sample CD:</i> <code>TWINKLE</code>.</p>
      <p class="see"><i>Falling rain with offset pictures, landing splashes, rippling puddles and a storm palette is on the Sample CD:</i> <code>RAIN</code>.</p>
      <p class="see"><i>Falling snow that sways, a growing drift and bootprints that a touch leaves are on the Sample CD:</i> <code>SNOW</code>.</p>
      <p class="see"><i>Flames, flags and a waterfall that move in place are on the Sample CD:</i> <code>FLICKER</code>.</p>
      <p class="see"><i>Far hills that wobble in the heat, each row of blocks a loop started a picture behind the row under it, and a mirage that hides when you come near, are on the Sample CD:</i> <code>HEATWAVE</code>.</p>
      <p class="see"><i>Light made of paint, in rings of brighter blocks, a trail a touch leaves and a hall a clock lights, is on the Sample CD:</i> <code>LIGHTOUT</code>.</p>
      <p class="see"><i>Shadows painted into the pictures, solid or dithered, a hop that shrinks one and a bee over a shadow block of its own, are on the Sample CD:</i> <code>SHADOWS</code>.</p>
      <p class="see"><i>Beams of light and drifting fog painted in dots, so the wall and the hills show through, and lanterns that carry a glow, are on the Sample CD:</i> <code>BEAMS</code>.</p>
      <p class="see"><i>Fireflies that blink by themselves, each its own monster with its own times and its own loop so no two keep in step, are on the Sample CD:</i> <code>LITEBUGS</code>.</p>
      <p class="see"><i>Autumn leaves that tumble on their frames and swoop down on zigzag paths, dropped by branch blocks on timers and blown by a gust every tree keeps, are on the Sample CD:</i> <code>LEAVES</code>.</p>`),s("3. Designing Games",`<h3>Character Maker</h3>
      <p>A hero has 20 animation sequences: standing idle, dying, being hurt, picking up and
      dropping an object, and fifteen more you tie to keys or the joystick. Each sequence has up
      to ten frames of one or two blocks, and can need an object in the inventory or use up a
      counter (arrows, for instance). Set the hero’s hit points, lives and starting
      inventory (up to ten objects). A frame can give birth to a monster: that is how a hero
      shoots.</p>
      <p class="see"><i>On the Sample CD:</i> <code>THROWIT</code>, <code>MANYWEAP</code>, <code>PICKITUP</code>, <code>KITMOVES</code>, <code>HOMEKEYS</code>, <code>KITDUCK</code>, <code>CHOOSE</code>, <code>WHEEL</code>, <code>RIDEALNG</code> (a rocket and a canoe that keep moving by themselves), <code>HEALTH</code>, <code>POWERUP</code>, <code>SLIDE</code>, <code>BOOTS</code>, <code>GRAVITY</code>, <code>SWIM</code>, <code>GUSTS</code>, <code>DROPDOWN</code> (a monster that falls when the crate under it breaks) and <code>QUIKSAND</code> (sand that gives way where you stand still).</p>
      <h3>Monster Maker</h3>
      <p>A monster set has up to 64 monsters of up to 20 frames each. Each one moves toward the
      hero, away, at random or along a path you draw; it can attack when the hero comes close,
      pass through walls or be stopped by them, and die when killed, at the end of its path,
      after a time or never. A dying monster can leave another behind, and killing it can add to
      the score.</p>
      <p class="see"><i>On the Sample CD:</i> <code>MONSTERS</code>, <code>FOLLOWME</code>, <code>FLOCK</code>, <code>SEEN</code>, <code>BIGBUG</code>, <code>PHASES</code>, <code>GIANT</code>, <code>WHOWINS</code>, <code>HERETODY</code>, <code>SEEDNEST</code> and <code>POPUPS</code>.</p>
      <p class="see"><i>Rockets that turn into their bursts at the end of their path, launchers that are blocks giving birth to them, and bursts nine monsters wide, are on the Sample CD:</i> <code>FIREWORK</code>.</p>
      <h3>Map Maker</h3>
      <p>Paint a map with background blocks and place up to 200 monsters on it (up to 50 are
      shown on the screen at once). <b>Z</b> zooms out to see the whole map. You can limit
      scrolling to part of the map.</p>
      <p class="see"><i>Water that moves, drawn as a loop of blocks, is on the Sample CD:</i> <code>SHORE</code>.</p>
      <p class="see"><i>On the Sample CD:</i> <code>SCROLL</code>, <code>ONEMAP</code>, <code>OVERHEAD</code> (a top-down room and roads joined by their edges), <code>TOWNLINK</code> (a world map, a town and a house, each its own scene and scale), <code>BLK150</code>, <code>PARALLAX</code> and <code>BELTWAY</code> (scenery that slides past), <code>DIAGWRAP</code> (a tilted road that wraps), <code>HORIZON</code>, <code>ROADTILE</code> (roads drawn from straight, corner, diagonal and bridge blocks), <code>CORNER</code> (a room drawn from a corner) <code>NEARFAR</code> (a far plane drawn small and pale) and <code>VERYFAR</code> (a figure only a few pixels tall, with slow steps, walking a long way off).</p>`),s("3. Designing Games",`<h3>Image Reader</h3>
      <p>Opens a GIF picture and cuts blocks out of it, up to 9 by 15 blocks at a time: a quick
      way to turn a drawing from a paint program into scenery. (Game-Maker 3.0 shows GIF
      pictures directly, so the older backdrop files, <code>.BKD</code>, are seldom needed.)</p>
      <h3>Sound Designer</h3>
      <p>A sound set holds 30 PC speaker sounds; each can also name a Sound Blaster
      <code>.VOC</code> recording to play instead. The first nine are played by the game itself:
      hit points gained, a monster dies, money gained and spent, a life gained, score up and
      down, and a counter up and down. The Sound Designer also converts <code>.CMF</code> music
      for Game-Maker.</p>
      <p class="see"><i>On the Sample CD:</i> <code>SOUNDS</code>, <code>SNDBOARD</code>; <code>OUTLOUD</code> for <code>.VOC</code> voices.</p>
      <h3>Integrator</h3>
      <p>Each square on the Integrator’s screen is a scene. The green ones are the title
      screen and the end of the game. Give each scene its palette, map, block sets, monsters,
      character, sounds and music, then draw links between scenes: a link is a door on one map
      that leads to a spot on another.</p>
      <p class="see"><i>On the Sample CD:</i> <code>ROOMS</code>, <code>TEACHTWI</code>, <code>WIREDRM</code> (levers, a bridge and a trap door wired with counters), <code>FIRSTGAM</code>, <code>TRYAGAIN</code> and <code>SHOW</code>.</p>
      <p>Pictures and words between levels are <i>multimedia displays</i>: a <code>.GIF</code>,
      an <code>.FLI</code> animation, a <code>.TXT</code> file (30 characters to a line) or a
      <code>.LST</code> list that shows several of them in turn. Each line of a list is a file
      name and the seconds to show it.</p>
      <p class="see"><i>On the Sample CD:</i> <code>PICTURES</code>, <code>SAYSOMTH</code>, <code>EVRYTALK</code>, <code>CUTSCENE</code> and <code>MAKETITL</code>.</p>
      <p class="see"><i>What the player program itself is made of (bytes at offsets, a new word the same size as the old one, a backup first) is on the Sample CD:</i> <code>UNDRHOOD</code>.</p>`),s("3. Designing Games",`<h2>Games made with Game-Maker</h2>
      <p>These Sandbox Software games use Game-Maker’s blocks, monsters, maps and
      Integrator scenes. Open their files in the tools to see how they work, and build your own
      without programming. The pictures are their own maps, drawn from their own files.</p>
      ${y(e.slice(0,4),3)}`),s("3. Designing Games",`${y(e.slice(4,8),7)}
      <div class="note"><strong>See how they work.</strong> Sandbox Software’s games are on the
      CD. Open any of them in Game-Maker’s design tools and look at its blocks, monsters and
      maps, then make something of your own.</div>`)]}function oe(){return[s("4. Utilities",`<span class="chapter">4</span>
      <h1>Utilities</h1>
      ${c(q,"Figure 4-1. The Utilities menu.",[0,2])}
      <h3>Backup</h3>
      <p>Copies every file of a game into a <code>.ZIP</code> archive, saved in the Downloads
      folder of the computer you are using today. (In 1994 Backup copied a game to diskettes
      in drive A:, and Restore copied it back.)</p>
      <h3>Restore</h3>
      <p>Puts a game that came with Game-Maker back the way it was on the CD. Your changes to
      it are lost. (On a 1994 PC you did this by copying the game’s folder from the CD
      with <code>COPY</code>.)</p>
      <h3>Transfer</h3>
      <p>Packages a game for others to play. Put a blank diskette from the disk box in
      drive A:, choose Transfer and the game, and answer <code>A:\\</code>. When the transfer
      is done you may also <b>(D)ownload</b> it: the archive has the game’s files and its own
      <code>.EXE</code>, ready for DOSBox or a real PC.</p>
      <h3>Joystick Setup and Diagnostic</h3>
      <p>On this computer joysticks and game pads are set up for you.</p>`),s("4. Utilities",`<h2>When something goes wrong</h2>
      <p>Game-Maker reports problems in a red box. Press the highlighted letter to answer it.</p>
      ${c(X,"Figure 4-2. An error box.",[5,12])}
      <table>
        <tr><th>Message</th><th>What to do</th></tr>
        <tr><td>Can’t find <i>file</i>!</td><td>The file is not in the game area. Check the folder on the bottom line, or choose the file from the list instead of typing it.</td></tr>
        <tr><td>I can’t access the disk!</td><td>There is no diskette in drive A:. Pick one from the disk box.</td></tr>
        <tr><td>The disk in drive A: isn’t blank</td><td>Transfer needs a blank diskette.</td></tr>
        <tr><td>Not ready reading drive A</td><td>At the DOS prompt: put a diskette in drive A:, then answer <code>R</code> to Retry or <code>F</code> to Fail.</td></tr>
        <tr><td>Bad command or file name</td><td>DOS doesn’t know that command. Check the spelling, or <code>CD</code> into the game’s folder first.</td></tr>
      </table>
      <p>Shareware games are play-only. To change one, ask its author for permission and
      the files, as its <code>README</code> explains. Sandbox Software’s own games are the
      exception: open them in Game-Maker and see how they work.</p>`),s("4. Utilities",`<h2>Troubleshooting a real PC</h2>
      <p>The PC on this desk is set up for you, so none of these come up here. They are what
      owners of a real 1994 PC ran into most.</p>
      <table>
        <tr><th>Problem</th><th>What helped</th></tr>
        <tr><td>Out of memory</td><td>Game-Maker needs about 512K of the 640K below the first megabyte. Type <code>MEM</code>; take memory-resident programs out of <code>AUTOEXEC.BAT</code> and <code>CONFIG.SYS</code>, or start MS-DOS 6 “clean” (press <kbd>F5</kbd> or hold <kbd>Shift</kbd> at “Starting MS-DOS…”).</td></tr>
        <tr><td>Won’t start</td><td>MS-DOS 4.1 or later is needed; OS/2 and Windows NT won’t do. From Windows 3.1, run it as a full-screen DOS program (not under Windows 3.0). Turn off QEMM’s Stealth mode.</td></tr>
        <tr><td>The menus can’t start a tool</td><td>Some PCs can’t run one program from inside another. Type <code>GMBAT</code> for the plain batch-file menu.</td></tr>
        <tr><td>Strange colors or a broken picture</td><td>Choose standard VGA, or your Super VGA card’s chip set, on the configuration screen. Deleting <code>C:\\GM\\CONFIG.DAT</code> starts the configuration over.</td></tr>
        <tr><td>No mouse pointer</td><td>Load the mouse driver (<code>MOUSE</code>) before starting Game-Maker.</td></tr>
        <tr><td>No sound</td><td>Check the Sound Blaster’s address, IRQ and DMA settings. Other cards, such as the Pro Audio Spectrum 16, need their Sound Blaster mode turned on.</td></tr>
      </table>`),s("5. The Game-Maker BBS",`<span class="chapter">5</span>
      <h1>The Game-Maker BBS</h1>
      <p>Game-Maker owners shared their games as shareware on bulletin board systems. Type
      <code>TERMINAL</code> and pick <i>The -= S A N D B O X =- BBS</i> from the dialing
      directory. <i>The Sofa</i>, a multi-line board for chatting, is there too.</p>
      ${c(Z,"Figure 5-1. Logging on to The Sandbox.",[1,11])}
      <p>Press <kbd>F</kbd> for the sand pile of files, then <kbd>D</kbd> and a game’s number to download it. It is
      unpacked into <code>C:\\DOWNLOAD</code>. <kbd>G</kbd> says goodbye and hangs up.</p>
      <h3>What is shareware?</h3>
      <p>Shareware is try-before-you-buy. You may play a shareware game and share copies of it.
      If you enjoy it, send the author the registration fee shown in its text files and in the
      paper catalog on the desk. Many authors sent registered users more levels. The few
      dollars a store or a mail-order library charged for a shareware disk paid for the disk
      and the copying, not the game: the registration fee was the author’s.</p>`),s("6. Sharing Your Games",`<span class="chapter">6</span>
      <h1>Sharing Your Games</h1>
      <div class="note"><strong>Historical terms.</strong> These do not apply to the Sandbox
      Edition. Today’s license, the MIT License, is on the next page.</div>
      <h3>In 1994</h3>
      <p>Game-Maker’s license let you install it on one computer at a time and keep a
      backup copy. Games you made could be <i>transferred</i> and given away free to no more
      than ten people, who could not pass them on; the gameware you drew could go to anyone.
      Giving a game to more people, or for money, took a license from Recreational Software
      Designs:</p>
      <ul>
        <li><b>Shareware.</b> Every owner had one, as long as the game asked its players a
        registration fee of at least $5.00 and the author paid RSD 10% of the fees, every
        quarter.</li>
        <li><b>Selling games.</b> A commercial license, with a royalty per copy.</li>
      </ul>
      <p>The license was printed on the sealed disk envelope, and opening it meant you agreed.</p>`),s("6. Sharing Your Games",`<h3>Today</h3>
      <p>In 2014 Andy Stone released Game-Maker’s source code under the <b>MIT
      License</b>, and this edition keeps it. Use, copy, change, share or sell Game-Maker and the
      games you make with it, with no limit on people and nothing to pay: just keep the
      copyright and license notice with the program. Sandbox Software’s registration fees
      are part of their 1995 story; the games are free.</p>`),s("Appendix A. Specifications",`<h1>Appendix A. Specifications</h1>
      <h3>Hardware</h3>
      <ul>
        <li>286 or better, IBM AT or PS/2 compatible (a 286 runs some games slowly); 512K memory available</li>
        <li>MS-DOS 4.1 or later; runs full screen from Windows 3.1</li>
        <li>Standard VGA (320 by 200, 256 colors); Super VGA cards with ATI, Trident 8800 and 8900, Paradise, Tseng ET3000 and ET4000 chip sets</li>
        <li>Two button Microsoft compatible mouse; 102 key keyboard (most others work)</li>
        <li>Hard disk; 3½″ 1.44 MB drive; double-spin CD-ROM drive for the bonus CD. Optional: joystick, Sound Blaster compatible sound card</li>
      </ul>
      <h3>Maps (scenes)</h3>
      <ul>
        <li>100 by 100 blocks (2000 by 2000 pixels), or a smaller area you choose. A VGA screen is 16 by 10 blocks.</li>
        <li>Scrolling in all directions; the right side joins the left and the top joins the bottom.</li>
        <li>255 colors plus “clear”. Doors take the character to other scenes.</li>
      </ul>`),s("Appendix A. Specifications",`<h3>Picture blocks</h3>
      <ul>
        <li>Solid on each side separately, or passable. Gravity in any of eight directions.</li>
        <li>Objects can be picked up and put down. Touching a block can play a sound and change money, hit points, lives, ammunition and other counters.</li>
        <li>Blocks can change with time or when touched, and can give birth to monsters.</li>
      </ul>
      <h3>Characters</h3>
      <ul>
        <li>Twenty animation sequences of up to ten frames; one or two blocks in size.</li>
        <li>Inventory, and an initial inventory. An object or counter can enable a sequence.</li>
        <li>Counters: money, lives, hit points, score, five designer counters and fifteen sequence counters.</li>
        <li>Shoots designer drawn objects; dies when hit points reach zero.</li>
      </ul>
      <h3>Monsters</h3>
      <ul>
        <li>Up to 64 monsters in a set, 20 frames each; up to 200 monsters per scene.</li>
        <li>Move toward or away from the character, at random, along a path, or attack along a path when in range.</li>
        <li>Live until killed, until the end of a path, for a set time, or forever. Can give birth to another monster when they die.</li>
      </ul>
      <h3>Multimedia</h3>
      <ul>
        <li>Slide shows of FLI animations, GIF pictures and text, before or after any level.</li>
        <li>Sound Blaster music (<code>.CMF</code>) and digitized sound (<code>.VOC</code>); 30 sounds per scene.</li>
      </ul>`),s("Appendix B. Files and Folders",`<h1>Appendix B. Files and Folders</h1>
      <p>Game-Maker lives in <code>C:\\GM</code>, with one folder (game area) for each game.
      Keep all of a game’s files in its folder, with DOS names of up to eight letters.</p>
      <table>
        <tr><th>Ending</th><th>What it holds</th></tr>
        <tr><td><code>.GAM</code></td><td>The game itself, made by the Integrator</td></tr>
        <tr><td><code>.MAP</code></td><td>A map (scene)</td></tr>
        <tr><td><code>.BBL</code> <code>.MBL</code> <code>.CBL</code></td><td>Background, monster and character block sets</td></tr>
        <tr><td><code>.MON</code> <code>.CHR</code></td><td>Monsters; a character</td></tr>
        <tr><td><code>.PAL</code></td><td>A palette</td></tr>
        <tr><td><code>.SND</code></td><td>A sound set</td></tr>
        <tr><td><code>.CMF</code> <code>.VOC</code></td><td>Sound Blaster music; a digitized sound</td></tr>
        <tr><td><code>.GIF</code> <code>.FLI</code> <code>.BKD</code></td><td>A picture, an animation, an old-style backdrop</td></tr>
        <tr><td><code>.TXT</code> <code>.LST</code></td><td>Text screens; a list of displays to show in turn</td></tr>
        <tr><td><code>.REC</code></td><td>A recorded game: a demo or a high score</td></tr>
      </table>`),s("Appendix C. The Copy Check",`<h1>Appendix C. The Copy Check</h1>
      <p>A copy of Game-Maker whose registration doesn’t match asks a question each time
      it starts: a page of this guide, a paragraph and a word to type in. The page numbers are
      the ones printed at the foot of these pages.</p>
      <p>Count only the paragraphs of text on that page, from the top: not headings, tables,
      lists, boxed notes or picture captions. Then count words; “Game-Maker” is one
      word.</p>
      <p>A new copy comes unregistered, so GM asks every time until you register it. While it
      asks, this guide opens beside the monitor at the right page, and the registration card
      lies next to it: write your name, <b>Mail the card</b> for your registration number (the
      reply comes right back) and choose <b>Apply</b>. Or type <code>GM REGISTER</code> and
      enter the name and number as the program asks.</p>
      <div class="note"><strong>Why?</strong> Disks were easy to copy; a thick printed manual was
      not. Many programs of the day asked for a word from the manual. RSD’s own questions
      came from its printed book; this edition asks from this guide.</div>`),s("Appendix D. About This Edition",`<h1>Appendix D. About This Edition</h1>
      <p>Game-Maker was written by Recreational Software Designs of Amherst, New Hampshire, and
      sold from 1991, first on diskettes and in 1994, as version 3.0, on CD-ROM with a
      comb-bound manual. This guide describes a recreation that runs in a web browser, in its
      own Sandbox Edition box. It is not a PC emulator, and no DOS program runs: the DOS
      prompt, the BBS and the utilities are a simulation made to look and act as they did,
      Game-Maker’s menus and designers are rebuilt from their original source code, and
      the games are played by a new engine, ported from PLAYGAME’s source, that reads
      the original files. Only a few parts of the hardware are emulated, such as the VGA
      screen and the Sound Blaster’s FM music chip.</p>
      <p>Games you make here are saved in the original formats, so they also play in DOSBox
      or on a real PC.</p>
      <p>The shareware on the BBS and in the disk box belongs to its authors and is shown in
      its shareware state only. Please honor the authors’ registration terms.</p>
      <p>In 2014 Game-Maker’s author, Andy Stone, released its source code under the
      <b>MIT License</b>. This edition is a modified fork of it by Lewis Moten, ported to the
      browser with Claude Opus 5.5, and it is MIT licensed too: the games you make are yours to
      share however you like (Chapter 6).</p>
      <div class="note"><strong>Make-believe:</strong> Sandbox Software, its address, the BBS
      phone numbers and the brands on this desk are made up.</div>`),{cover:!0,body:T(`
        <div class="cover-banner"><em>It’s as much fun to create computer games as it is to play them.</em></div>
        <div class="cover-title">Notes</div>`,D("cover"),n("div",{class:"rr-notes","aria-hidden":"true"}),n("div",{class:"cover-foot"},"GAME-MAKER · Recreational Software Designs"))}]}const G=e=>[...ee(e),...te(e),...oe()],O=()=>Promise.race([x(),new Promise(e=>setTimeout(()=>e([]),4e3))]);async function ae(){return P(G(await O()))}async function se(e,o={}){const[t,{openBox:a},{gmBoxItems:r}]=await Promise.all([O(),f(()=>import("./viewer-Blv6CbW9.js"),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]),import.meta.url),f(()=>import("./gmItems-BrwC3SvP.js").then(l=>l.g),__vite__mapDeps([26,1,27,28,29,5,4,6,7,8,11,10,12,13,14,30,31,32,33,34,15,35,20,9,36,37,38,39,19,40,41,42,43,44,2,3,16,17,18,45,46,47,48,49,50,51,52,53]),import.meta.url)]),d=(await L().catch(()=>[])).filter(I),i={file:"game-maker-owners-guide.epub",make:()=>f(()=>import("./ownersBook-gGgxBMyu.js"),__vite__mapDeps([54,1,5,55,56,15,57,58]),import.meta.url).then(l=>l.ownersBook())};return a("Game-Maker SE 3.0",P(G(t)),r(d),{binding:"comb",start:e,epub:i,...o})}function re(e){let o="";for(const t of e){const a=t.head?.[1]??"";if(a===o)continue;o=a;const r=/^(?:(\d+)|Appendix ([A-Z]))\. (.+)$/.exec(a);if(r)t.marks=[{id:r[1]??r[2],no:r[1]??r[2],title:r[3]}];else if(a==="Contents"){t.marks=[{id:"contents",no:"",title:"Contents"}];for(const d of t.body.flatMap(i=>[...i.querySelectorAll("tr")])){const i=d.querySelector("td:last-child")?.textContent?.trim()??"";/^\d+$/.test(i)&&(d.dataset.page=i)}}}}function P(e){const o=d=>Array.isArray(d.body)?d.body:[d.body],t=e.slice(0,-1).map((d,i)=>({kind:i===0||d.cover?"cover":"text",head:d.head,body:o(d)}));re(t);const a={kind:"cover",body:o(e[e.length-1])},r=B(e.length)-e.length;for(let d=0;d<r;d++)t.push({kind:"notes",head:[M,"Notes"],body:[n("h2",null,"Notes"),n("div",{class:"mp-ruled"})]});return[...t,a]}const we=Object.freeze(Object.defineProperty({__proto__:null,dosManualPages:ae,openDosManual:se},Symbol.toStringTag,{value:"Module"}));export{we as a,ye as d};
