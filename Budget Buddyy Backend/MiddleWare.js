import jwt from 'jsonwebtoken';

const secretKey = '123456789';

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).send("Access denied. No token provided.");

    const tokenParts = token.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
        return res.status(401).send("Invalid token format.");
    }

    const jwtToken = tokenParts[1];

    jwt.verify(jwtToken, secretKey, (err, decoded) => {
        if (err) return res.status(403).send("Invalid token.");

        req.email = decoded.email;
        req._id=decoded._id; // Assuming email is stored in the JWT payload
        next();
    });
}

export default authenticateToken;