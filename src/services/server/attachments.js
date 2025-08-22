import prisma from "@/lib/prisma";


export const getAttachments = async (page, limit, searchParams, params) => {
    const rentAgreementId = params.id;

    try {
        const attachments = await prisma.attachment.findMany({
            where: {
                rentAgreementId: parseInt(rentAgreementId),
            },
        });
        return {data: attachments};
    } catch (error) {
        console.error("Error fetching attachments:", error);
        throw new Error("Internal server error");
    }
};

export const createAttachment = async (data, params) => {
    const rentAgreementId = params.id;
    try {
        const attachment = await prisma.attachment.create({
            data: {
                url: data.url,
                rentAgreementId: parseInt(rentAgreementId),
            },
        });
        return {data: attachment};
    } catch (error) {
        console.error("Error saving attachment:", error);
    }
};

export async function deleteAttachment(id) {
    try {
        const attachment = await prisma.attachment.delete({
            where: {
                id: parseInt(id),
            },
        });
        return attachment;
    } catch (error) {
        console.error("Error deleting attachment:", error);
        throw new Error("Internal server error");
    }
}
