import Ionicons from '@expo/vector-icons/Ionicons';
import {Button, Platform, StyleSheet, View} from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import {ThemedText} from '@/components/ThemedText';
import {ThemedView} from '@/components/ThemedView';
import WebView from "react-native-webview";
import Constants from 'expo-constants';
import {useEffect, useRef, useState} from "react";
// const XylophoneWebApp = require('@/htmlapp/index.html');
import * as FileSystem from 'expo-file-system';
import {Asset, useAssets} from "expo-asset";
import {readAsStringAsync} from "expo-file-system";
import {assets} from "@/app/assets";

export default function TabTwoScreen() {
    const [reloadKey, setReloadKey] = useState(0);

    const webViewRef = useRef(null);

    const reloadWebView = () => {
        console.log("Reloading WebView...");
        console.log(webViewRef.current);
        webViewRef.current?.reload(); // Call the WebView's reload method
    };

    const [index, indexLoadingError] = useAssets(
        require("../../assets/htmlapp/index.html")
    );

    const [html, setHtml] = useState("");


    const [htmlContent, setHtmlContent] = useState('');
    //
    // useEffect(() => {
    //     if (index) {
    //         console.log(index[0].localUri);
    //         readAsStringAsync(index[0].localUri).then((data) => {
    //             console.log(data);
    //             setHtml(data);
    //         });
    //     }
    //
    //     // Read HTML file from assets
    //     const loadHtml = async () => {
    //         try {
    //             // const fileUri = FileSystem.bundleDirectory + 'htmlapp/index.html';
    //             const fileUri = 'file:///android_asset/htmlapp/index.html';
    //             console.log(fileUri);
    //             const html = await FileSystem.readAsStringAsync(fileUri);
    //             setHtmlContent(html);
    //         } catch (err) {
    //             console.warn('Error loading HTML', err);
    //         }
    //     };
    //
    //     console.log(Platform.OS);
    //
    //     // loadHtml();
    // }, []);

    const [htmlUri, setHtmlUri] = useState<string|null>(null);
    const [scriptUri, setScriptUri] = useState<string|null>(null);
    const [assetsMap, setAssetsMap] = useState<object|null>(null);

    useEffect(() => {
        const loadHtml = async () => {
            const asset = Asset.fromModule(require('../../assets/htmlapp/index.html'));
            await asset.downloadAsync();

            
            const assetContent = await FileSystem.readAsStringAsync(asset.localUri || '');
            // const asset = (await Asset.loadAsync(require('../../assets/htmlapp/index.html')))[0];


            const map: object = {};
            for (const key of Object.keys(assets)) {
                const a = Asset.fromModule(assets[key])
                await a.downloadAsync();
                map[key] = a.localUri;
            }

            setAssetsMap(map);
            console.log(assetsMap);

            const scriptAsset = Asset.fromModule(require('../../assets/htmlapp/assets/index-kJXbv41I.assetjs'));
            await scriptAsset.downloadAsync();

            if (!scriptAsset.localUri) {
                console.error('Failed to download script asset.');
                return;
            }

            console.log('Script asset downloaded successfully:', scriptAsset.localUri);

            setScriptUri(scriptAsset.localUri);

            console.log("asset.localUri: ", asset.localUri);
            console.log("asset.uri: ",asset.uri);
            setHtmlUri(asset.localUri);


            /**
             * This is necessary because of this bug in webview:
             * https://github.com/react-native-webview/react-native-webview/issues/2723
             * https://github.com/react-native-webview/react-native-webview/issues/656#issuecomment-561067913
             */
            setTimeout(() => setRenderedOnce(true), 1000);
        };
        loadHtml();
    }, []);


    const uri = 'file:///android_asset/htmlapp/index.html';
    // console.log("refresh", htmlUri);


    const [renderedOnce, setRenderedOnce] = useState(false);

    if (!htmlUri) return null; // Loading state

    return (
        <View
            style={styles.container}
        >
            <Button title="Reload Component" onPress={() => setReloadKey(reloadKey + 1)} />
            <Button title="Reload WebView" onPress={reloadWebView} />
            { htmlContent === null ? null :
            <WebView
                originWhitelist={['*']}
                // source={{ html: '<html lang="en"><head></head><body><h1>YOOOO</h1></body></html>'}}

                /**
                * Option 1.
                *   Load with file:///android_assets// path
                *   It works, but is android specific + not usable for dev / react expo go.
                *   I don't know how to load it in ios.
                */
                // source={{uri: 'file:///android_asset/htmlapp/index.html'}}

                /**
                * Option 2.
                *   Trying to use recommended expo-asset way to try to make it cross-platform
                *   This loads html, but does  not load relative script file:
                *   <script defer src="./assets/index-SmOVRYv2.assetjs"></script>
                *   I think it is not possible to load files from inside the js app,
                *   because when expo-asset downloads file, it renames it. Example:
                *   file:///data/user/0/me.naumenko.xylophone/cache/ExponentAsset-79988415d52bcbaf01decd9a77b8fe68.assetjs"
                */
                source={renderedOnce ? {uri: htmlUri} : undefined}

                /**
                * Option 3. Preprocess index.html, to replace links with "expo-assets" links.
                *   So I first read index.html file into memory.
                *   Then load js file as expo-asset and get it's URL.
                *   Then replace:
                *       <script defer src="./assets/index-SmOVRYv2.assetjs"></script>
                *       with
                *       <script defer src="file:///data/user/0/me.naumenko.xylophone/cache/ExponentAsset-79988415d52bcbaf01decd9a77b8fe68.assetjs"></script>
                *   Then load this into webview as raw html.
                *
                *   This option renders html, but still the script fails to be loaded/executed
                */
                // source={renderedOnce ? {html: htmlContent} : undefined}

                ref={webViewRef} // Attach WebView reference
                key={reloadKey}
                cacheEnabled={false}
                style={styles.container}
                domStorageEnabled={true}
                allowUniversalAccessFromFileURLs={true}
                allowFileAccessFromFileURLs={true}
                mixedContentMode="always"
                javaScriptEnabled={true}
                useWebKit={true}
                allowFileAccess={true}
                webviewDebuggingEnabled={true}
                onError={(syntheticEvent) => {
                    const {nativeEvent} = syntheticEvent;
                    console.log('WebView error: ', nativeEvent);
                }}
                onHttpError={(syntheticEvent) => {
                    const {nativeEvent} = syntheticEvent;
                    console.log('WebView HTTP error: ', nativeEvent);
                }}
                onSourceChanged={() => (console.log("Updated source..."))}
                injectedJavaScript={`
                    // Debug
                    window.onerror = function(message, sourcefile, lineno, colno, error) {
                      alert("Message: " + message + " - Source: " + sourcefile + " Line: " + lineno + ":" + colno);
                      return true;
                    };
                    
                     oldConsole = console;
                     console = new Object();
                     
                     console.log = function (...logs) {
                        oldConsole.log(...logs);
                        window.ReactNativeWebView.postMessage(JSON.stringify(logs));
                     }
                     
                     console.debug = console.log;
                     console.info = console.log;
                     console.warn = console.log;
                     console.error = console.log;
                     
                    console.log("A test console.log() message from webview!", 123);
 
                    document.body.style.backgroundColor = 'cyan';
                       
                    const jsonAssetsMap = \'${JSON.stringify(assetsMap)}\';
                    console.log("Assets map: ", jsonAssetsMap);
                    window.assets = JSON.parse(jsonAssetsMap);

                    console.log("Inserting script: ${scriptUri}");
                    const scriptTag = document.createElement("script");
                    scriptTag.defer = true;
                    scriptTag.src = "${scriptUri}";
                    document.head.appendChild(scriptTag);

                    true; // note: this is required, or you'll sometimes get silent failures
                    true; // note: this is required, or you'll sometimes get silent failures
                `}
                onMessage={(event) => {
                    const {data} = event.nativeEvent;
                    console.log('Received message from WebView:', data);
                }}
            />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    container: {
        flex: 1,
        marginTop: Constants.statusBarHeight,
    },
});
