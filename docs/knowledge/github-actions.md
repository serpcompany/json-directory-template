- area:content
    - gets added when a PR changes files under packages/content/data/websites
    - meaning: “this PR touches source content entries”
- generated:websites-json
    - gets added when a PR changes data/websites.json
    - meaning: “this PR touches the generated website index/data file”

So the intent is:

- one label for the editable/source content
- one label for the generated output file
