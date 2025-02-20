export function extractUrl(url) {
    try {
        const urlObj = new URL(url);
        const basePath = urlObj.origin;  // Lấy basePath động
        const pathSegments = urlObj.pathname.split('/').filter(Boolean); // Loại bỏ phần rỗng

        if (pathSegments.length < 3) {
            throw new Error("Invalid URL format");
        }

        const folder = pathSegments[0]; // Lấy thư mục đầu tiên
        const userId = pathSegments[pathSegments.length - 2]; // ID là phần kế cuối
        const fileName = decodeURIComponent(pathSegments[pathSegments.length - 1]); // File name là phần cuối

        return { userId, fileName };
    } catch (error) {
        console.error("Error extracting userId and fileName:", error);
        return null;
    }
}
