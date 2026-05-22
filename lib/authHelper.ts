import bcrypt from 'bcryptjs';

export const hashPin = (pin: string) => {
    return bcrypt.hashSync(pin, 8);
};

export const comparePin = (pin: string, hash: string) => {
    return bcrypt.compareSync(pin, hash);
};
