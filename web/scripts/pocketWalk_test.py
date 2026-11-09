"""Step parser tests, no board: cd web/scripts && python3 -m unittest pocketWalk_test"""
import unittest
from pathlib import Path

from pocketWalk import parse_steps


class Parse(unittest.TestCase):
    def test_all_steps(self):
        s = parse_steps("# c\n\nbanner 1 Hello there\ntap 10 20\ntap 1 2 500\nwait 5\nsend L\nexpect L 0\nshot a 0,0,1,1\nscreen s\nrelease\nhold 3 4\n")
        self.assertEqual([c for _, c, _ in s], ["banner", "tap", "tap", "wait", "send", "expect", "shot", "screen", "release", "hold"])
        self.assertEqual(s[0][2], ["1 Hello there"])
        self.assertEqual(s[5][2], ["L 0"])
        self.assertEqual(s[2][2], ["1", "2", "500"])

    def test_errors(self):
        for bad in ["jump", "tap 1", "tap a b", "wait", "shot", "shot a 1,2", "release now", "banner"]:
            with self.assertRaises(ValueError, msg=bad):
                parse_steps(bad)

    def test_line_numbers(self):
        with self.assertRaisesRegex(ValueError, "line 3"):
            parse_steps("wait 1\n\nnope")

    def test_examples_parse(self):
        for f in (Path(__file__).parent / "pocket-walks").glob("*.txt"):
            self.assertTrue(parse_steps(f.read_text()), f.name)


if __name__ == "__main__":
    unittest.main()
