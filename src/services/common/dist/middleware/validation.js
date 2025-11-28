"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const zod_1 = require("zod");
function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: err.errors
                });
            }
            next(err);
        }
    };
}
//# sourceMappingURL=validation.js.map