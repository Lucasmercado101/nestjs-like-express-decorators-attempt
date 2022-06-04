import {
  Request,
  Response,
  NextFunction,
  RequestHandler,
  Router
} from "express";

export const BODY_PARAM = "body";

const RouterRESTMethodFactory =
  (method: keyof Router) =>
  (path: string, middleware?: RequestHandler[]) =>
  (target: any, propertyKey: string | symbol, descriptor: any) => {
    if (!target["routes"]) {
      target["routes"] = { [method]: [[propertyKey, path, middleware]] };
    } else {
      target["routes"][method].push([propertyKey, path, middleware]);
    }

    let toConvertVars: string[] = [];

    // There are req. things to pass to the original fn
    if (target.toConvert) {
      toConvertVars = target.toConvert
        .filter((x: string) => x[0] === propertyKey)
        // sort so they're passed in the right order
        .sort((a: any, b: any) => a[2] - b[2])
        .map((x: any) => x[1]);
    }

    const originalFn = descriptor.value;

    // TODO: ?
    // console.log(Reflect.getMetadata("design:paramtypes", target, propertyKey));

    descriptor.value = async (
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      let convertedVars: any = [];

      if (toConvertVars.length > 0) {
        for (const paramType of toConvertVars) {
          switch (paramType) {
            case BODY_PARAM:
              convertedVars.push(req.body);
              break;
          }
        }
      }

      try {
        const toResp = await originalFn(...convertedVars);

        res.json(toResp);
      } catch (err) {
        next(err);
      }
    };
  };

export const Get = RouterRESTMethodFactory("get");
export const Post = RouterRESTMethodFactory("post");
export const Put = RouterRESTMethodFactory("put");
export const Delete = RouterRESTMethodFactory("delete");
export const Patch = RouterRESTMethodFactory("patch");
export const Use = RouterRESTMethodFactory("use");
