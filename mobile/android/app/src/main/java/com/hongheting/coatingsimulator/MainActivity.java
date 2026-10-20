package com.hongheting.coatingsimulator;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

/** Edge-to-edge: page header draws behind the status bar; insets passed to CSS as --sat/--sab (px). */
public class MainActivity extends BridgeActivity {
    private int insetTop = 0, insetBottom = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.parseColor("#f4f8fa"));
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.setAppearanceLightStatusBars(false);    // light icons on dark teal header
        c.setAppearanceLightNavigationBars(true); // dark icons on light page bg

        final WebView wv = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(wv, (v, insets) -> {
            Insets i = insets.getInsets(WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float d = getResources().getDisplayMetrics().density;
            insetTop = Math.round(i.top / d);
            insetBottom = Math.round(i.bottom / d);
            pushInsets(wv);
            return insets;
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        pushInsets(getBridge().getWebView());
    }

    private void pushInsets(WebView wv) {
        if (wv == null) return;
        final String js = "(function(){var s=document.documentElement.style;s.setProperty('--sat','" + insetTop
            + "px');s.setProperty('--sab','" + insetBottom + "px');window.__nativeInsets={top:" + insetTop
            + ",bottom:" + insetBottom + "};})();";
        wv.post(() -> wv.evaluateJavascript(js, null));
    }
}
