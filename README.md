# Wedding website (Jekyll, English + Polish)

A static site with a language switcher and an RSVP form that saves each guest's answer, including their meal choice, to a Google Sheet. It doesn't need plugins, a database or paid services.

```
_config.yml          names, date, venue, RSVP deadline, RSVP endpoint
_data/i18n.yml       interface text (nav, form labels) in EN + PL
_data/wedding.yml    menu options shown on the RSVP form
en/  pl/             page content: edit these Markdown files
apps-script/Code.gs  the script that receives RSVPs into Google Sheets
```

## 1. Run it locally

You need Ruby. On Windows, install it with [RubyInstaller](https://rubyinstaller.org/) (choose the version "with Devkit").

```bash
bundle install
bundle exec jekyll serve
```

Then open http://localhost:4000. The site sends you to `/en/` or `/pl/` based on your browser's language, and remembers the visitor's choice after that.

## 2. Connect the RSVP form to Google Sheets

1. Create a new Google Sheet, for example "Wedding RSVPs".
2. Open **Extensions → Apps Script**. Delete the starter code and paste in the contents of `apps-script/Code.gs`. Save.
3. Click **Deploy → New deployment**. Choose the type **Web app**, set *Execute as* to **Me** and *Who has access* to **Anyone**, then click Deploy. Approve the permission request.
4. Copy the **Web app URL** (it ends in `/exec`) and paste it into `_config.yml`:
   ```yaml
   rsvp_endpoint: "https://script.google.com/macros/s/XXXX/exec"
   ```
5. Send a test RSVP. A tab named `RSVPs` appears in the sheet with one row per guest.

If you edit `Code.gs` later, use **Deploy → Manage deployments → Edit → New version**. That keeps the same URL.

### Meal counts for the caterer

Add a second tab and paste this formula:

```
=QUERY(RSVPs!A:I, "select E, count(D) where C = 'yes' group by E label count(D) 'Guests'", 1)
```

For a list of dietary needs only, use this one:

```
=FILTER(RSVPs!D:F, RSVPs!F:F <> "")
```

## 3. Publish it for free

**GitHub Pages:** push this folder to a GitHub repo. In the repo, go to **Settings → Pages → Source** and choose **GitHub Actions**. The included workflow (`.github/workflows/pages.yml`) builds and deploys the site every time you push to `main`.

**Netlify or Cloudflare Pages** also work. Set the build command to `jekyll build` and the output folder to `_site`.

To use your own domain, add it in the hosting settings and set `url:` in `_config.yml`.

## Customising

- **Menu:** edit `_data/wedding.yml`. The `id` is what gets saved to the sheet, so it stays the same in both languages.
- **Add a page:** create `en/whatever.md` and `pl/cokolwiek.md`. Give both the same `ref:` and an `order:` value, and add the label under `nav:` in `_data/i18n.yml`. The language switcher finds each page's translation through `ref`.
- **Colours and fonts:** edit the variables at the top of `assets/css/style.css`. Both fonts include the Polish characters (ą, ę, ł, ż).
- **Placeholders** in `[square brackets]` are the parts you need to fill in.
