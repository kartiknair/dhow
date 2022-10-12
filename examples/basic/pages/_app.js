import { Head } from '@fsoc/dhow';

const App = ({ Component, pageProps }) => {
    return (<>
        <Head>
            <meta name={'author'} content={'fsoc'} />
        </Head>

        <Component {...pageProps} />
    </>);
};

export default App;
