// https://geoffrich.net/posts/page-transitions-1/
export const load = ({ url }) => {
    const currentRoute = url.pathname;

    return {
        currentRoute,
    };
};
