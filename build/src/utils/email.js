"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const path_1 = __importDefault(require("path"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const email_templates_1 = __importDefault(require("email-templates"));
const logger_1 = __importDefault(require("../server/logger"));
const config_1 = require("../server/config");
async function sendEmail(template, receiver, locals) {
    try {
        await emailTemplates(template, receiver, locals);
        logger_1.default.info("Email sent successfully");
    }
    catch (error) {
        logger_1.default.error("Email notification error:", error);
    }
}
async function emailTemplates(template, receiver, locals) {
    try {
        const transporter = nodemailer_1.default.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: config_1.SENDER_EMAIL,
                pass: config_1.SENDER_EMAIL_PASSWORD,
            },
        });
        const email = new email_templates_1.default({
            message: {
                from: `Uptimer App <${config_1.SENDER_EMAIL}>`,
            },
            send: true,
            preview: false,
            transport: transporter,
            views: {
                options: {
                    extension: "ejs",
                },
            },
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: path_1.default.join(__dirname, "../../build"),
                },
            },
        });
        await email.send({
            template: path_1.default.join(__dirname, "..", "/emails", template),
            message: { to: receiver },
            locals,
        });
    }
    catch (error) {
        logger_1.default.error(error);
    }
}
//# sourceMappingURL=email.js.map