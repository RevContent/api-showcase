#AMP Feed

The Accelerated Mobile Pages (AMP) Project is an open source initiative that embodies the vision that publishers can create mobile optimized content once and have it load instantly everywhere. Learn more at [www.ampproject.org](http://www.ampproject.org)

For Mobile Amp Placements use the following ad code. This will provide a full page layout. Change `transform: translateX(-15px)` to match the offset from the edge of the viewport for your placement.

```
&lt;amp-ad style="transform: translateX(-15px)" type="revcontent" data-id="94025" data-source="feed" width="100vw" height="100vh" layout="flex-item" data-wrapper="my-feed">
    &lt;div overflow style="position: absolute; bottom: 0; background: #fff; padding: 10px 0; display: flex; justify-content: center; width: 100%;border-bottom: 1px solid #eee;">
        &lt;div style="padding: 10px; border: 1px solid #ccc; border-radius: 3px; font-size: 16px; color: #444;">
            Click to Resize
        &lt;/div>
    &lt;/div>
&lt;/amp-ad>
```

For Desktop placements use a `responsive` layout like the following.

```
&lt;amp-ad type="revcontent" data-id="94025" data-source="feed" width="100" height="300" layout="responsive" data-wrapper="my-feed">
    &lt;div overflow style="position: absolute; bottom: 0; background: #fff; padding: 10px 0; display: flex; justify-content: center; width: 100%;border-bottom: 1px solid #eee;">
        &lt;div style="padding: 10px; border: 1px solid #ccc; border-radius: 3px; font-size: 16px; color: #444;">
            Click to Resize
        &lt;/div>
    &lt;/div>
&lt;/amp-ad>
```

##Options

###Widget ID
The Widget ID to load.

###Layout
The layout to use see [amp docs](https://www.ampproject.org/docs/design/amp-html-layout#(tl;dr)-summary-of-layout-requirements-&-behaviors)

###Width
width based on layout option

###Height
height based on layout option