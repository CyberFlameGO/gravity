package builder

import (
	"io/ioutil"
	"path/filepath"

	"github.com/gravitational/gravity/lib/defaults"
	"github.com/gravitational/gravity/lib/utils"

	"gopkg.in/check.v1"
)

type SourceSuite struct{}

var _ = check.Suite(&SourceSuite{})

func (*SourceSuite) TestManifestSources(c *check.C) {
	var testCases = []struct {
		comment  string
		path     func(*check.C) string
		errCheck func(*check.C, error)
	}{
		{
			comment: "valid input from a file",
			path: func(c *check.C) string {
				dir := c.MkDir()
				path := filepath.Join(dir, defaults.ManifestFileName)
				c.Assert(ioutil.WriteFile(path, []byte("{}"), defaults.SharedReadWriteMask), check.IsNil)
				return path
			},
		},
		{
			comment: "valid input from a directory",
			path: func(c *check.C) string {
				dir := c.MkDir()
				path := filepath.Join(dir, defaults.ManifestFileName)
				c.Assert(ioutil.WriteFile(path, []byte("{}"), defaults.SharedReadWriteMask), check.IsNil)
				return dir
			},
		},
		{
			comment: "expects a manifest in the directory",
			path: func(c *check.C) string {
				return c.MkDir()
			},
			errCheck: func(c *check.C, err error) {
				c.Assert(err, check.ErrorMatches, "no Chart.yaml exists.*")
			},
		},
		{
			comment: "invalid input from a socket",
			path: func(*check.C) string {
				return "unix:///run/test.sock"
			},
			errCheck: func(c *check.C, err error) {
				c.Assert(err, check.ErrorMatches, ".*stat.*no such file or directory")
			},
		},
	}

	for _, ts := range testCases {
		_, err := GetClusterImageSource(ts.path(c), utils.NewTestLogger(c))
		if ts.errCheck == nil {
			c.Assert(err, check.IsNil, check.Commentf(ts.comment))
		} else {
			c.Logf(ts.comment)
			ts.errCheck(c, err)
		}
	}
}
