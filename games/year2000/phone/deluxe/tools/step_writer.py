"""Minimal STEP (AP214) writer: colored extruded convex prisms, for the simple part models.

kicad-cli's GLB export loads STEP (not VRML) models, so every model in kicad/3d has a .step next to its .wrl.
Structure copied from a KiCad stock model (same entity types); one MANIFOLD_SOLID_BREP per prism.
Written by Claude Sonnet 5.5 under Lewis Moten's direction.
"""
import math


class Step:
    def __init__(self):
        self.lines = []
        self.n = 10          # ids 1..10 are the fixed header entities

    def e(self, txt):
        self.n += 1
        self.lines.append("#%d = %s;" % (self.n, txt))
        return "#%d" % self.n

    def pt(self, x, y, z):
        return self.e("CARTESIAN_POINT('',(%.6f,%.6f,%.6f))" % (x, y, z))

    def dr(self, x, y, z):
        return self.e("DIRECTION('',(%.6f,%.6f,%.6f))" % (x, y, z))

    def plane(self, o, n, r):
        ax = self.e("AXIS2_PLACEMENT_3D('',%s,%s,%s)" % (self.pt(*o), self.dr(*n), self.dr(*r)))
        return self.e("PLANE('',%s)" % ax)

    def edge(self, a, b, pa, pb):
        d = [pb[i] - pa[i] for i in range(3)]
        ln = math.sqrt(sum(v * v for v in d))
        vec = self.e("VECTOR('',%s,%.6f)" % (self.dr(d[0] / ln, d[1] / ln, d[2] / ln), ln))
        line = self.e("LINE('',%s,%s)" % (self.pt(*pa), vec))
        return self.e("EDGE_CURVE('',%s,%s,%s,.T.)" % (a, b, line))

    def face(self, loop, plane):
        oes = ",".join(self.e("ORIENTED_EDGE('',*,*,%s,%s)" % (ed, fl)) for ed, fl in loop)
        lp = self.e("EDGE_LOOP('',(%s))" % oes)
        fb = self.e("FACE_BOUND('',%s,.T.)" % lp)
        return self.e("ADVANCED_FACE('',(%s),%s,.T.)" % (fb, plane))

    def prism(self, poly, z0, z1):
        n = len(poly)
        vb = [self.e("VERTEX_POINT('',%s)" % self.pt(x, y, z0)) for x, y in poly]
        vt = [self.e("VERTEX_POINT('',%s)" % self.pt(x, y, z1)) for x, y in poly]
        eb = [self.edge(vb[i], vb[(i + 1) % n], (*poly[i], z0), (*poly[(i + 1) % n], z0)) for i in range(n)]
        et = [self.edge(vt[i], vt[(i + 1) % n], (*poly[i], z1), (*poly[(i + 1) % n], z1)) for i in range(n)]
        ev = [self.edge(vb[i], vt[i], (*poly[i], z0), (*poly[i], z1)) for i in range(n)]
        faces = [self.face([(et[i], ".T.") for i in range(n)], self.plane((*poly[0], z1), (0, 0, 1), (1, 0, 0))),
                 self.face([(eb[i], ".F.") for i in reversed(range(n))], self.plane((*poly[0], z0), (0, 0, -1), (1, 0, 0)))]
        for i in range(n):
            j = (i + 1) % n
            dx, dy = poly[j][0] - poly[i][0], poly[j][1] - poly[i][1]
            ln = math.hypot(dx, dy)
            faces.append(self.face([(eb[i], ".T."), (ev[j], ".T."), (et[i], ".F."), (ev[i], ".F.")],
                                   self.plane((*poly[i], z0), (dy / ln, -dx / ln, 0), (dx / ln, dy / ln, 0))))
        shell = self.e("CLOSED_SHELL('',(%s))" % ",".join(faces))
        return self.e("MANIFOLD_SOLID_BREP('',%s)" % shell)

    def style(self, solid, col):
        c = self.e("COLOUR_RGB('',%.3f,%.3f,%.3f)" % col)
        fac = self.e("FILL_AREA_STYLE_COLOUR('',%s)" % c)
        fas = self.e("FILL_AREA_STYLE('',(%s))" % fac)
        sfa = self.e("SURFACE_STYLE_FILL_AREA(%s)" % fas)
        sss = self.e("SURFACE_SIDE_STYLE('',(%s))" % sfa)
        ssu = self.e("SURFACE_STYLE_USAGE(.BOTH.,%s)" % sss)
        psa = self.e("PRESENTATION_STYLE_ASSIGNMENT((%s))" % ssu)
        return self.e("STYLED_ITEM('color',(%s),%s)" % (psa, solid))

    def text(self, title, solids, styles):
        b = self.n
        ctx, u1, u2, u3, unc, axp, axpt, axd1, axd2 = [b + k for k in range(1, 10)]
        head = "\n".join([
            "ISO-10303-21;", "HEADER;", "FILE_DESCRIPTION(('Phone of the Future simple model'),'2;1');",
            "FILE_NAME('%s.step','2026-11-03',('Claude Sonnet 5.5'),('Lewis Moten'),'potf','python','');" % title,
            "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));", "ENDSEC;", "DATA;",
            "#1 = APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#2);",
            "#2 = APPLICATION_CONTEXT('core data for automotive mechanical design processes');",
            "#3 = SHAPE_DEFINITION_REPRESENTATION(#4,#10);",
            "#4 = PRODUCT_DEFINITION_SHAPE('','',#5);",
            "#5 = PRODUCT_DEFINITION('design','',#6,#9);",
            "#6 = PRODUCT_DEFINITION_FORMATION('','',#7);",
            "#7 = PRODUCT('%s','%s','',(#8));" % (title, title),
            "#8 = PRODUCT_CONTEXT('',#2,'mechanical');",
            "#9 = PRODUCT_DEFINITION_CONTEXT('part definition',#2,'design');",
            "#10 = ADVANCED_BREP_SHAPE_REPRESENTATION('',(#%d,%s),#%d);" % (axp, ",".join(solids), ctx)])
        tail = "\n".join([
            "#%d = ( GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#%d)) GLOBAL_UNIT_ASSIGNED_CONTEXT((#%d,#%d,#%d)) REPRESENTATION_CONTEXT('Context #1','3D Context with UNIT and UNCERTAINTY') );" % (ctx, unc, u1, u2, u3),
            "#%d = ( LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.) );" % u1,
            "#%d = ( NAMED_UNIT(*) PLANE_ANGLE_UNIT() SI_UNIT($,.RADIAN.) );" % u2,
            "#%d = ( NAMED_UNIT(*) SI_UNIT($,.STERADIAN.) SOLID_ANGLE_UNIT() );" % u3,
            "#%d = UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-007),#%d,'distance_accuracy_value','confusion accuracy');" % (unc, u1),
            "#%d = AXIS2_PLACEMENT_3D('',#%d,#%d,#%d);" % (axp, axpt, axd1, axd2),
            "#%d = CARTESIAN_POINT('',(0.,0.,0.));" % axpt,
            "#%d = DIRECTION('',(0.,0.,1.));" % axd1,
            "#%d = DIRECTION('',(1.,0.,0.));" % axd2,
            "#%d = PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,(#7));" % (b + 10),
            "#%d = MECHANICAL_DESIGN_GEOMETRIC_PRESENTATION_REPRESENTATION('',(%s),#%d);" % (b + 11, ",".join(styles), ctx),
            "ENDSEC;", "END-ISO-10303-21;", ""])
        return head + "\n" + "\n".join(self.lines) + "\n" + tail


def write_step(path, title, prisms):
    """prisms: list of (polygon [(x,y)...] CCW, z0, z1, (r,g,b))."""
    s = Step()
    solids, styles = [], []
    for poly, z0, z1, col in prisms:
        sol = s.prism(poly, z0, z1)
        solids.append(sol)
        styles.append(s.style(sol, col))
    open(path, "w").write(s.text(title, solids, styles))
